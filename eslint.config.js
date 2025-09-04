import js from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginReact from 'eslint-plugin-react'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  {
    ignores: ['node_modules', '!.*', '**/dist', '**/build', 'apps/nextjs/.next']
  },

  {
    extends: [js.configs.recommended, ...tsEslint.configs.recommended],
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  {
    files: [
      'apps/{nextjs,vite,storybook}/**/*.{jsx,tsx}',
      'packages/{components}/**/*.{jsx,tsx}'
    ],
    languageOptions: { globals: globals.browser },
    extends: [pluginReact.configs.flat.recommended],
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  eslintPluginPrettierRecommended
)
