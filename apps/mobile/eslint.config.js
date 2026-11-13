// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Every user-facing string must go through i18n (tech-stack.md, rule 5).
 * `react/jsx-no-literals` blocks text in JSX children; punctuation-only strings are allowed.
 * Props are ignored (variant="filled", name="today"…) – for accessibilityLabel/placeholder/title
 * use t() anyway; code review catches those.
 */
const ALLOWED_JSX_STRINGS = ['·', '•', '–', '—', '-', '/', ':', '%', '+', '−', '×', '(', ')', ',', '.', '…', '|', '›', '‹'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*', 'expo-env.d.ts'],
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'react/jsx-no-literals': [
        'error',
        { noStrings: true, ignoreProps: true, allowedStrings: ALLOWED_JSX_STRINGS },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: { 'react/jsx-no-literals': 'off' },
  },
]);
