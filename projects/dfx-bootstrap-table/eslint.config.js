// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': 'warn',
      '@angular-eslint/no-inputs-metadata-property': 'warn',
      '@angular-eslint/no-output-rename': 'warn',
      '@angular-eslint/no-input-rename': 'warn',
      '@angular-eslint/component-selector': [
        'warn',
        {
          type: 'element',
          prefix: 'ngb',
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
