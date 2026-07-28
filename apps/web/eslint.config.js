import antfu from '@antfu/eslint-config';
import reactPlugin from 'eslint-plugin-react';

export default antfu(
    {
        react: true,
        stylistic: {
            indent: 4,
            quotes: 'single',
            semi: true,
        },
        ignores: ['dist'],
    },
    {
        files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
        rules: {
            'style/semi': ['error', 'always'],
            '@typescript-eslint/explicit-function-return-type': 'error',
        },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: {
            'react-legacy': reactPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            'antfu/top-level-function': 'off',
            'react-legacy/function-component-definition': [
                'error',
                {
                    namedComponents: 'arrow-function',
                    unnamedComponents: 'arrow-function',
                },
            ],
        },
    },
);
