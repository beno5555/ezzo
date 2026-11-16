// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const css = require('@eslint/css').default;
const webcity = require('./eslint-rules/design-tokens-only');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      // Type information, which no-floating-promises needs.
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      // An element (app-post-card), or an attribute on a native element (button[appButton]), which
      // keeps that element's own behaviour.
      '@angular-eslint/component-selector': [
        'error',
        [
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
          },
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
          },
        ],
      ],
      // ADR 0003: every …Api call is a promise, so a forgotten await is a silent bug.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // Off: the conventions use `type` for data shapes and an `interface` wherever a contract serves a purpose.
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    // Component styles, read as CSS so the design token rule sees their syntax tree.
    files: ['src/app/**/*.css'],
    plugins: { css },
    language: 'css/css',
  },
  {
    // Design tokens only (DESIGN.md). The design token file, src/design-tokens.css, is outside src/app
    // and so exempt. Specs, test helpers and the language files (dictionaries, the store) build no class
    // list, and their text may hold a # or brackets ("Post #123", '[data-theme]').
    files: ['src/app/**/*.ts', 'src/app/**/*.html', 'src/app/**/*.css'],
    ignores: ['src/app/**/*.spec.ts', 'src/app/**/testing/**', 'src/app/core/languages/*.ts'],
    plugins: { webcity },
    rules: {
      'webcity/design-tokens-only': 'error',
    },
  },
]);
