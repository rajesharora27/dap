/**
 * ESLint Configuration for DAP Frontend
 * 
 * This configuration enforces code quality standards including:
 * - TypeScript strict mode
 * - React best practices
 * - Code complexity limits
 * - Module boundary enforcement (feature isolation)
 */

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
      // ============================================
      // TypeScript Strict Rules
      // ============================================
      
      // Warn on explicit any - work towards removing
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Warn on unused variables (allow underscore prefix for intentional)
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      
      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowFunctionsWithoutTypeParameters: true
      }],
      
      // Ensure consistent type imports
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      
      // Ban ts-comment without explanation
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': false
      }],

      // ============================================
      // React Rules
      // ============================================
      
      // No need for React import in scope (React 17+)
      'react/react-in-jsx-scope': 'off',
      
      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Prop types not needed with TypeScript
      'react/prop-types': 'off',
      
      // Require keys in lists
      'react/jsx-key': 'error',
      
      // No unknown DOM properties
      'react/no-unknown-property': 'error',

      // ============================================
      // Code Quality & Complexity
      // ============================================
      
      // Cyclomatic complexity limit
      'complexity': ['warn', { max: 15 }],
      
      // Maximum depth of nested blocks
      'max-depth': ['warn', { max: 4 }],
      
      // Maximum lines per function (React components can be larger)
      'max-lines-per-function': ['warn', { 
        max: 200,
        skipBlankLines: true,
        skipComments: true
      }],
      
      // Maximum parameters in a function
      'max-params': ['warn', { max: 6 }],
      
      // Prefer const over let when not reassigned
      'prefer-const': 'warn',
      
      // No useless catch that just rethrows
      'no-useless-catch': 'warn',
      
      // No console in production code (allow warn/error)
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],

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
      
      // No duplicate imports
      'import/no-duplicates': 'warn',

      // Prevent circular dependencies (enable after fixing existing cycles)
      'import/no-cycle': 'off'
    }
  }
);
