import { workspaces } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, chain } from '@angular-devkit/schematics';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

type ProjectDefinition = workspaces.ProjectDefinition;
type WorkspaceDefinition = workspaces.WorkspaceDefinition;

interface NgAddOptions {
  project?: string;
  storage?: boolean;
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'theme';
const FLASH_PREVENTION_MARKER = 'dfx-theme Flash Prevention';
const STORAGE_KEY_PLACEHOLDER = '__DFX_THEME_STORAGE_KEY__';

export function ngAdd(options: NgAddOptions = {}): Rule {
  return async (tree) => {
    const workspace = await readWorkspace(tree);
    const projectName = resolveProjectName(workspace, options.project);
    const project = getProject(workspace, projectName);

    const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    const useStorage = options.storage === true || options.storageKey !== undefined;

    return chain([addThemeProvider(project, useStorage, options.storageKey), addFlashPreventionScript(project, storageKey)]);
  };
}

function addThemeProvider(project: ProjectDefinition, useStorage: boolean, customStorageKey: string | undefined): Rule {
  return (tree) => {
    const mainPath = getMainFilePath(project);
    const configPath = findApplicationConfigPath(tree, mainPath);

    const provider = createThemeProvider(useStorage, customStorageKey);
    const imports = useStorage ? ['provideTheme', 'withThemeStorage'] : ['provideTheme'];

    addNamedImports(tree, configPath, imports, 'dfx-theme');
    addProviderToApplicationConfig(tree, configPath, provider);

    return tree;
  };
}

function addFlashPreventionScript(project: ProjectDefinition, storageKey: string): Rule {
  return (tree) => {
    const indexPath = getIndexHtmlPath(project);

    if (!tree.exists(indexPath)) {
      throw new SchematicsException(`Could not find the application index.html file at "${indexPath}".`);
    }

    const indexHtml = tree.readText(indexPath);

    if (indexHtml.includes(FLASH_PREVENTION_MARKER)) {
      return tree;
    }

    const headMatch = /<head(?:\s[^>]*)?>/i.exec(indexHtml);

    if (headMatch?.index === undefined) {
      throw new SchematicsException(`Could not find a <head> element in "${indexPath}".`);
    }

    const recorder = tree.beginUpdate(indexPath);
    recorder.insertRight(headMatch.index + headMatch[0].length, `\n${createFlashPreventionScript(storageKey)}`);
    tree.commitUpdate(recorder);

    return tree;
  };
}

async function readWorkspace(tree: Tree): Promise<WorkspaceDefinition> {
  const host: workspaces.WorkspaceHost = {
    readFile: async (path) => tree.readText(path),
    writeFile: async (path, data) => {
      if (tree.exists(path)) {
        tree.overwrite(path, data);
      } else {
        tree.create(path, data);
      }
    },
    isDirectory: async (path) => !tree.exists(path) && tree.getDir(path).subfiles.length > 0,
    isFile: async (path) => tree.exists(path),
  };

  return (await workspaces.readWorkspace('/angular.json', host)).workspace;
}

function resolveProjectName(workspace: WorkspaceDefinition, requestedProject?: string): string {
  if (requestedProject) {
    const project = getProject(workspace, requestedProject);

    if (!isApplicationProject(project)) {
      throw new SchematicsException(`Project "${requestedProject}" is not an application project.`);
    }

    return requestedProject;
  }

  const applicationProjectNames = [...workspace.projects]
    .filter(([, project]) => isApplicationProject(project))
    .map(([projectName]) => projectName);

  if (applicationProjectNames.length === 1) {
    return applicationProjectNames[0];
  }

  if (applicationProjectNames.length === 0) {
    throw new SchematicsException('No application project found. Run ng add dfx-theme --project <name>.');
  }

  throw new SchematicsException(
    `Multiple application projects found (${applicationProjectNames.join(', ')}). Run ng add dfx-theme --project <name>.`,
  );
}

function getProject(workspace: WorkspaceDefinition, projectName: string): ProjectDefinition {
  const project = workspace.projects.get(projectName);

  if (!project) {
    throw new SchematicsException(`Project "${projectName}" could not be found.`);
  }

  return project;
}

function isApplicationProject(project: ProjectDefinition): boolean {
  return project.extensions['projectType'] === 'application';
}

function getMainFilePath(project: ProjectDefinition): string {
  const buildOptions = project.targets.get('build')?.options;
  const mainPath = buildOptions?.['browser'] ?? buildOptions?.['main'];

  if (typeof mainPath !== 'string') {
    throw new SchematicsException('Could not determine the application main file from the build target.');
  }

  return normalizeTreePath(mainPath);
}

function getIndexHtmlPath(project: ProjectDefinition): string {
  const indexOption = project.targets.get('build')?.options?.['index'];

  if (typeof indexOption === 'string') {
    return normalizeTreePath(indexOption);
  }

  if (isRecord(indexOption) && typeof indexOption['input'] === 'string') {
    return normalizeTreePath(indexOption['input']);
  }

  return joinTreePath(project.sourceRoot ?? joinTreePath(project.root, 'src'), 'index.html');
}

function findApplicationConfigPath(tree: Tree, mainPath: string): string {
  if (!tree.exists(mainPath)) {
    throw new SchematicsException(`Could not find the application main file at "${mainPath}".`);
  }

  const mainSource = tree.readText(mainPath);
  const configIdentifier = findBootstrapConfigIdentifier(mainSource, mainPath);
  const importPath = findRelativeImportPath(mainSource, configIdentifier, mainPath);

  const unresolvedPath = normalizeTreePath(posix.join(dirname(mainPath), importPath));
  const candidates = [unresolvedPath, `${unresolvedPath}.ts`, posix.join(unresolvedPath, 'index.ts')];

  const configPath = candidates.find((candidate) => tree.exists(candidate));

  if (!configPath) {
    throw new SchematicsException(`Could not find the application config imported by "${mainPath}".`);
  }

  return configPath;
}

function findBootstrapConfigIdentifier(source: string, mainPath: string): string {
  const match = /bootstrapApplication\s*\([^,]+,\s*([A-Za-z_$][\w$]*)/m.exec(source);

  if (!match) {
    throw new SchematicsException(`Could not find a configured bootstrapApplication call in "${mainPath}".`);
  }

  return match[1];
}

function findRelativeImportPath(source: string, identifier: string, mainPath: string): string {
  const importExpression = new RegExp(`import\\s*\\{[^}]*\\b${escapeRegExp(identifier)}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`);

  const match = importExpression.exec(source);
  const importPath = match?.[1];

  if (!importPath?.startsWith('.')) {
    throw new SchematicsException(`Could not resolve the application config imported by "${mainPath}".`);
  }

  return importPath;
}

function createThemeProvider(useStorage: boolean, customStorageKey?: string): string {
  if (!useStorage) {
    return 'provideTheme()';
  }

  if (!customStorageKey) {
    return 'provideTheme(withThemeStorage())';
  }

  return `provideTheme(withThemeStorage({ key: ${toJavascriptStringLiteral(customStorageKey)} }))`;
}

function addNamedImports(tree: Tree, path: string, symbols: string[], moduleName: string): void {
  const source = tree.readText(path);
  const existingImport = findNamedImport(source, moduleName);

  if (existingImport) {
    updateNamedImport(tree, path, existingImport, symbols, moduleName);
    return;
  }

  insertNamedImport(tree, path, source, symbols, moduleName);
}

function findNamedImport(source: string, moduleName: string): RegExpExecArray | null {
  const importExpression = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escapeRegExp(moduleName)}['"]\\s*;?`);

  return importExpression.exec(source);
}

function updateNamedImport(tree: Tree, path: string, importMatch: RegExpExecArray, symbols: string[], moduleName: string): void {
  const existingSymbols = importMatch[1]
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean);

  const mergedSymbols = [...new Set([...existingSymbols, ...symbols])].sort();
  const replacement = `import { ${mergedSymbols.join(', ')} } from '${moduleName}';`;

  const recorder = tree.beginUpdate(path);
  recorder.remove(importMatch.index, importMatch[0].length);
  recorder.insertLeft(importMatch.index, replacement);
  tree.commitUpdate(recorder);
}

function insertNamedImport(tree: Tree, path: string, source: string, symbols: string[], moduleName: string): void {
  const importMatches = [...source.matchAll(/^import\b[^;]*;\s*$/gm)];
  const lastImport = importMatches.at(-1);

  const insertionOffset = lastImport?.index === undefined ? 0 : lastImport.index + lastImport[0].length;

  const prefix = insertionOffset === 0 ? '' : '\n';
  const importStatement = `${prefix}import { ${symbols.join(', ')} } from '${moduleName}';\n`;

  const recorder = tree.beginUpdate(path);
  recorder.insertLeft(insertionOffset, importStatement);
  tree.commitUpdate(recorder);
}

function addProviderToApplicationConfig(tree: Tree, path: string, provider: string): void {
  const source = tree.readText(path);

  if (/\bprovideTheme\s*\(/.test(source)) {
    return;
  }

  const providersMatch = /\bproviders\s*:\s*\[/.exec(source);

  if (providersMatch?.index !== undefined) {
    insertIntoExistingProvidersArray(tree, path, source, providersMatch, provider);
    return;
  }

  insertProvidersProperty(tree, path, source, provider);
}

function insertIntoExistingProvidersArray(
  tree: Tree,
  path: string,
  source: string,
  providersMatch: RegExpExecArray,
  provider: string,
): void {
  const openingBracket = providersMatch.index + providersMatch[0].lastIndexOf('[');
  const hasExistingProviders = source.slice(openingBracket + 1).trimStart()[0] !== ']';

  const recorder = tree.beginUpdate(path);
  recorder.insertRight(openingBracket + 1, `${provider}${hasExistingProviders ? ', ' : ''}`);
  tree.commitUpdate(recorder);
}

function insertProvidersProperty(tree: Tree, path: string, source: string, provider: string): void {
  const configMatch = /(?:ApplicationConfig\s*=|satisfies\s+ApplicationConfig)\s*\{/.exec(source);

  if (configMatch?.index === undefined) {
    throw new SchematicsException(`Could not find an ApplicationConfig object in "${path}".`);
  }

  const openingBrace = configMatch.index + configMatch[0].lastIndexOf('{');

  const recorder = tree.beginUpdate(path);
  recorder.insertRight(openingBrace + 1, `\n  providers: [${provider}],`);
  tree.commitUpdate(recorder);
}

function createFlashPreventionScript(storageKey: string): string {
  const script = readFlashPreventionAsset().replaceAll(STORAGE_KEY_PLACEHOLDER, JSON.stringify(storageKey)).trim();

  return `    <!-- ${FLASH_PREVENTION_MARKER} - Prevents FOUC in all browsers -->
    <script>
      ${script}
    </script>`;
}

function readFlashPreventionAsset(): string {
  const assetPaths = [
    join(__dirname, 'files', 'fouc-prevention.js'),
    join(process.cwd(), 'libs/dfx-theme/schematics/ng-add/files/fouc-prevention.js'),
  ];

  const assetPath = assetPaths.find((path) => existsSync(path));

  if (!assetPath) {
    throw new SchematicsException('Could not find the dfx-theme FOUC prevention script asset.');
  }

  return readFileSync(assetPath, 'utf8');
}

function normalizeTreePath(path: string): string {
  return path.replace(/^\/+/, '');
}

function joinTreePath(...paths: string[]): string {
  return normalizeTreePath(paths.filter(Boolean).join('/').replace(/\/+/g, '/'));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJavascriptStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`;
}
