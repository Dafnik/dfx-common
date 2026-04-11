import { lastValueFrom } from 'rxjs';

import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

import ngAdd from '../../schematics/ng-add';

describe('dfx-theme ng-add schematic', () => {
  const runner = new SchematicTestRunner('dfx-theme', 'libs/dfx-theme/schematics/collection.json');

  it('adds provideTheme and the flash prevention script for a single application project', async () => {
    const tree = await runNgAdd({}, createWorkspaceTree());
    const appConfig = tree.readText('/src/app/app.config.ts');
    const indexHtml = tree.readText('/src/index.html');

    expect(appConfig).toContain("import { provideTheme } from 'dfx-theme';");
    expect(appConfig).toContain('providers: [provideTheme()]');
    expect(indexHtml).toContain('dfx-theme Flash Prevention');
    expect(indexHtml).toContain('localStorage.getItem("theme")');
  });

  it('adds storage support when storage is enabled', async () => {
    const tree = await runNgAdd({ storage: true }, createWorkspaceTree());
    const appConfig = tree.readText('/src/app/app.config.ts');
    const indexHtml = tree.readText('/src/index.html');

    expect(appConfig).toContain("import { provideTheme, withThemeStorage } from 'dfx-theme';");
    expect(appConfig).toContain('providers: [provideTheme(withThemeStorage())]');
    expect(indexHtml).toContain('localStorage.getItem("theme")');
  });

  it('adds storage support with a custom storage key', async () => {
    const tree = await runNgAdd({ storageKey: 'app-theme' }, createWorkspaceTree());
    const appConfig = tree.readText('/src/app/app.config.ts');
    const indexHtml = tree.readText('/src/index.html');

    expect(appConfig).toContain("withThemeStorage({ key: 'app-theme' })");
    expect(indexHtml).toContain('localStorage.getItem("app-theme")');
  });

  it('requires a project when multiple application projects exist', async () => {
    expect(lastValueFrom(runner.callRule(ngAdd({}), createWorkspaceTree(['app', 'admin'])))).rejects.toThrow(
      'Multiple application projects found (app, admin). Run ng add dfx-theme --project <name>.',
    );
  });

  it('does not duplicate the flash prevention script when run again', async () => {
    const tree = await runNgAdd({}, createWorkspaceTree());
    const updatedTree = await runNgAdd({}, tree);
    const indexHtml = updatedTree.readText('/src/index.html');

    expect(indexHtml.match(/dfx-theme Flash Prevention/g)).toHaveLength(1);
  });

  async function runNgAdd(options: Parameters<typeof ngAdd>[0], tree: Tree): Promise<Tree> {
    return await lastValueFrom(runner.callRule(ngAdd(options), tree));
  }
});

function createWorkspaceTree(projectNames = ['app']): Tree {
  const tree = Tree.empty();

  tree.create('/angular.json', JSON.stringify(createAngularJson(projectNames), null, 2));

  for (const projectName of projectNames) {
    const prefix = projectName === 'app' ? '' : `projects/${projectName}/`;
    tree.create(
      `/${prefix}src/main.ts`,
      `import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
`,
    );
    tree.create(`/${prefix}src/app/app.ts`, 'export class App {}\n');
    tree.create(
      `/${prefix}src/app/app.config.ts`,
      `import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [],
};
`,
    );
    tree.create(
      `/${prefix}src/index.html`,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Test App</title>
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
`,
    );
  }

  return tree;
}

function createAngularJson(projectNames: string[]) {
  return {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    projects: Object.fromEntries(projectNames.map((projectName) => [projectName, createAngularProject(projectName)])),
  };
}

function createAngularProject(projectName: string) {
  const root = projectName === 'app' ? '' : `projects/${projectName}`;
  const sourceRoot = projectName === 'app' ? 'src' : `projects/${projectName}/src`;

  return {
    projectType: 'application',
    root,
    sourceRoot,
    architect: {
      build: {
        builder: '@angular/build:application',
        options: {
          browser: `${sourceRoot}/main.ts`,
          index: `${sourceRoot}/index.html`,
        },
      },
    },
  };
}
