/* eslint-env node */
module.exports = {
  root: true,
  ignorePatterns: ['dist', 'src/_archive/**'],
  env: { browser: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  plugins: ['react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/immutability': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-empty': 'warn',
    'react/no-unescaped-entities': 'warn',
  },
}
