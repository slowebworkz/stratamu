// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginToml from 'eslint-plugin-toml'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...eslintPluginToml.configs['flat/recommended'],
  {
    rules: {
      // Enforce consistent type definitions — prefer interfaces
      '@typescript-eslint/consistent-type-definitions': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          allowTypeImports: true,
        },
      ],

      // Catch unused variables, especially in type declarations
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // Ensure module boundaries are well-defined
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],

      // Prefer type-only imports to avoid runtime overhead
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // Prevent empty interfaces unless they extend something
      '@typescript-eslint/no-empty-interface': ['error'],

      // Enforce consistent member ordering in interfaces and types
      '@typescript-eslint/member-ordering': ['error'],
    },
  },
)
