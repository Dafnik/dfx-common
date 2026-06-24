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
    const project = workspace.projects.get(projectName);

    if (!project) {
      throw new SchematicsException(`Project "${projectName}" could not be found.`);
    }

    const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    const useStorage = options.storage === true || options.storageKey !== undefined;

    return chain([addThemeProvider(projectName, useStorage, options.storageKey), addFlashPreventionScript(project, storageKey)]);
  };
}

function addThemeProvider(projectName: string, useStorage: boolean, customStorageKey: string | undefined): Rule {
  return async (tree) => {
    const workspace = await readWorkspace(tree);
    const project = workspace.projects.get(projectName);

    if (!project) {
      throw new SchematicsException(`Project "${projectName}" could not be found.`);
    }

    const mainPath = getMainFilePath(project);
    const configPath = findApplicationConfigPath(tree, mainPath);
    const provider = createThemeProvider(useStorage, customStorageKey);
    const imports = useStorage ? ['provideTheme', 'withThemeStorage'] : ['provideTheme'];

    addNamedImports(tree, configPath, imports, 'dfx-theme');
    addProviderToApplicationConfig(tree, configPath, provider);

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

function getMainFilePath(project: ProjectDefinition): string {
  const buildOptions = project.targets.get('build')?.options;
  const mainPath = buildOptions?.['browser'] ?? buildOptions?.['main'];

  if (typeof mainPath !== 'string') {
    throw new SchematicsException('Could not determine the application main file from the build target.');
  }

  return normalizeTreePath(mainPath);
}

function findApplicationConfigPath(tree: Tree, mainPath: string): string {
  if (!tree.exists(mainPath)) {
    throw new SchematicsException(`Could not find the application main file at "${mainPath}".`);
  }

  const mainSource = tree.readText(mainPath);
  const bootstrapMatch = /bootstrapApplication\s*\([^,]+,\s*([A-Za-z_$][\w$]*)/m.exec(mainSource);

  if (!bootstrapMatch) {
    throw new SchematicsException(`Could not find a configured bootstrapApplication call in "${mainPath}".`);
  }

  const configIdentifier = bootstrapMatch[1];
  const importExpression = new RegExp(`import\\s*\\{[^}]*\\b${escapeRegExp(configIdentifier)}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`);
  const importMatch = importExpression.exec(mainSource);

  if (!importMatch || !importMatch[1].startsWith('.')) {
    throw new SchematicsException(`Could not resolve the application config imported by "${mainPath}".`);
  }

  const unresolvedPath = normalizeTreePath(posix.join(dirname(mainPath), importMatch[1]));
  const candidates = [unresolvedPath, `${unresolvedPath}.ts`, posix.join(unresolvedPath, 'index.ts')];
  const configPath = candidates.find((path) => tree.exists(path));

  if (!configPath) {
    throw new SchematicsException(`Could not find the application config imported by "${mainPath}".`);
  }

  return configPath;
}

function createThemeProvider(useStorage: boolean, customStorageKey: string | undefined): string {
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
  const importExpression = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escapeRegExp(moduleName)}['"]\\s*;?`);
  const importMatch = importExpression.exec(source);

  if (importMatch?.index !== undefined) {
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
    return;
  }

  const imports = [...source.matchAll(/^import\b[^;]*;\s*$/gm)];
  const insertionPoint = imports.at(-1)?.index;
  const insertionOffset = insertionPoint === undefined ? 0 : insertionPoint + imports.at(-1)![0].length;
  const prefix = insertionOffset === 0 ? '' : '\n';
  const recorder = tree.beginUpdate(path);
  recorder.insertLeft(insertionOffset, `${prefix}import { ${symbols.join(', ')} } from '${moduleName}';\n`);
  tree.commitUpdate(recorder);
}

function addProviderToApplicationConfig(tree: Tree, path: string, provider: string): void {
  const source = tree.readText(path);

  if (/\bprovideTheme\s*\(/.test(source)) {
    return;
  }

  const providersMatch = /\bproviders\s*:\s*\[/.exec(source);
  const recorder = tree.beginUpdate(path);

  if (providersMatch?.index !== undefined) {
    const openingBracket = providersMatch.index + providersMatch[0].lastIndexOf('[');
    const hasExistingProviders = source.slice(openingBracket + 1).trimStart()[0] !== ']';
    recorder.insertRight(openingBracket + 1, `${provider}${hasExistingProviders ? ', ' : ''}`);
    tree.commitUpdate(recorder);
    return;
  }

  const configMatch = /(?:ApplicationConfig\s*=|satisfies\s+ApplicationConfig)\s*\{/.exec(source);

  if (!configMatch?.index && configMatch?.index !== 0) {
    throw new SchematicsException(`Could not find an ApplicationConfig object in "${path}".`);
  }

  const openingBrace = configMatch.index + configMatch[0].lastIndexOf('{');
  recorder.insertRight(openingBrace + 1, `\n  providers: [${provider}],`);
  tree.commitUpdate(recorder);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    if (!headMatch?.index && headMatch?.index !== 0) {
      throw new SchematicsException(`Could not find a <head> element in "${indexPath}".`);
    }

    const recorder = tree.beginUpdate(indexPath);
    recorder.insertRight(headMatch.index + headMatch[0].length, `\n${createFlashPreventionScript(storageKey)}`);
    tree.commitUpdate(recorder);

    return tree;
  };
}

function resolveProjectName(workspace: WorkspaceDefinition, requestedProject: string | undefined): string {
  if (requestedProject) {
    const project = workspace.projects.get(requestedProject);

    if (!project) {
      throw new SchematicsException(`Project "${requestedProject}" could not be found.`);
    }

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

function isApplicationProject(project: ProjectDefinition): boolean {
  return project.extensions['projectType'] === 'application';
}

function getIndexHtmlPath(project: ProjectDefinition): string {
  const indexOption = project.targets.get('build')?.options?.['index'];

  if (typeof indexOption === 'string') {
    return normalizeTreePath(indexOption);
  }

  if (isJsonObject(indexOption) && typeof indexOption['input'] === 'string') {
    return normalizeTreePath(indexOption['input']);
  }

  return normalizeTreePath(joinTreePath(project.sourceRoot ?? joinTreePath(project.root, 'src'), 'index.html'));
}

function normalizeTreePath(path: string): string {
  return path.replace(/^\/+/, '');
}

function joinTreePath(...paths: string[]): string {
  return paths.filter(Boolean).join('/').replace(/\/+/g, '/');
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createFlashPreventionScript(storageKey: string): string {
  const flashPreventionScript = readFlashPreventionAsset().replaceAll(STORAGE_KEY_PLACEHOLDER, JSON.stringify(storageKey));

  return `    <!-- ${FLASH_PREVENTION_MARKER} - Prevents FOUC in all browsers -->
    <script>
      ${flashPreventionScript.trim()}
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

function toJavascriptStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`;
}
