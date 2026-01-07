// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  globalIgnores(['**/*.spec.ts']),
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: '',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: '',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);
