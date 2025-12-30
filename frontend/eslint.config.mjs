import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.*', 'jest.config.*', 'src/generated/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================
      // IMPORT BOUNDARY RULES - Enforce Modular Architecture
      // ============================================
      
      // Enforce imports through barrel files (index.ts)
      'no-restricted-imports': ['error', {
        patterns: [
          // Prevent direct imports from feature internals - must use barrel
          {
            group: ['@features/*/components/*', '*/features/*/components/*'],
            message: '⛔ Import from feature barrel (@features/featureName) instead of internal components path'
          },
          {
            group: ['@features/*/hooks/*', '*/features/*/hooks/*'],
            message: '⛔ Import from feature barrel (@features/featureName) instead of internal hooks path'
          },
          {
            group: ['@features/*/context/*', '*/features/*/context/*'],
            message: '⛔ Import from feature barrel (@features/featureName) instead of internal context path'
          },
          {
            group: ['@features/*/utils/*', '*/features/*/utils/*'],
            message: '⛔ Import from feature barrel (@features/featureName) instead of internal utils path'
          },
          // Allow graphql and types direct imports (they're often needed)
          // Prevent shared internal imports
          {
            group: ['@shared/components/*', '*/shared/components/*'],
            message: '⛔ Import from shared barrel (@shared or @shared/components) instead of internal path'
          },
          {
            group: ['@shared/hooks/*', '*/shared/hooks/*'],
            message: '⛔ Import from shared barrel (@shared) instead of internal hooks path'
          }
        ]
      }],

      // Import organization
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index'
        ],
        pathGroups: [
          { pattern: 'react', group: 'builtin', position: 'before' },
          { pattern: '@mui/**', group: 'external', position: 'after' },
          { pattern: '@apollo/**', group: 'external', position: 'after' },
          { pattern: '@features/**', group: 'internal', position: 'before' },
          { pattern: '@shared/**', group: 'internal', position: 'after' },
          { pattern: '@/**', group: 'internal', position: 'after' }
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],

      // Prevent circular dependencies (basic check)
      'import/no-cycle': 'off', // Enable after fixing existing cycles

      // Other rules
      'no-console': 'off',
      'prefer-const': 'warn'
    }
  }
);

