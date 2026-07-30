import antfu from '@antfu/eslint-config';
import reactPlugin from 'eslint-plugin-react';

export default function hmlogistikEslintConfig(
    { react: enableReact = true } = {},
    extraConfigs = [],
) {
    return antfu(
        {
            react: enableReact,
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
                '**/skills-lock.json',
                '**/*.md'
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
                'antfu/top-level-function': 'off',
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
                'react-legacy/function-component-definition': [
                    'error',
                    {
                        namedComponents: 'arrow-function',
                        unnamedComponents: 'arrow-function',
                    },
                ],
            },
        },
        ...(Array.isArray(extraConfigs) ? extraConfigs : []),
    );
}
