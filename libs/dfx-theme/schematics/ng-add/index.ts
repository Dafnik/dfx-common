import { Rule, SchematicsException, chain } from '@angular-devkit/schematics';
import { ProjectDefinition, WorkspaceDefinition, addRootProvider, readWorkspace } from '@schematics/angular/utility';

interface NgAddOptions {
  project?: string;
  storage?: boolean;
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'theme';
const FLASH_PREVENTION_MARKER = 'dfx-theme Flash Prevention';

export default function ngAdd(options: NgAddOptions = {}): Rule {
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
  return addRootProvider(projectName, ({ code, external }) => {
    const provideTheme = external('provideTheme', 'dfx-theme');

    if (!useStorage) {
      return code`${provideTheme}()`;
    }

    const withThemeStorage = external('withThemeStorage', 'dfx-theme');

    if (!customStorageKey) {
      return code`${provideTheme}(${withThemeStorage}())`;
    }

    return code`${provideTheme}(${withThemeStorage}({ key: ${toJavascriptStringLiteral(customStorageKey)} }))`;
  });
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
  return `    <!-- ${FLASH_PREVENTION_MARKER} - Prevents FOUC in all browsers -->
    <script>
      // prettier-ignore
  !function(){'use strict';try{const t=localStorage.getItem('${storageKey}')||'system',e='system'===t?window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':'light'===t||'dark'===t?t:'light',s=document.documentElement;s&&('dark'===e?(s.classList.remove('light'),s.classList.add('dark')):(s.classList.remove('dark'),s.classList.add('light')),s.setAttribute('data-theme',e),s.style.colorScheme=e)}catch(t){try{const t=document.documentElement;t&&(t.classList.remove('dark'),t.classList.add('light'),t.setAttribute('data-theme','light'),t.style.colorScheme='light')}catch(t){}}}();
    </script>`;
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
