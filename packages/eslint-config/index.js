import antfu from '@antfu/eslint-config';
import reactPlugin from 'eslint-plugin-react';

export default function hmlogistikEslintConfig(...userConfigs) {
    return antfu(
        {
            react: true,
            stylistic: {
                indent: 4,
                quotes: 'single',
                semi: true,
            },
            ignores: [
                '**/dist',
                '**/dist-*',
                '**/node_modules',
                '**/.turbo',
                '**/coverage',
                '**/prisma/generated',
                '**/docs',
            ],
            typescript: {
                overrides: {
                    'ts/explicit-function-return-type': ['error'],
                },
            },
        },
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
            rules: {
                'style/semi': ['error', 'always'],
                'node/prefer-global/process': 'off',
                'node/prefer-global/buffer': 'off',
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
        ...userConfigs,
    );
}
