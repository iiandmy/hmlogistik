import hmlogistikEslintConfig from '@hmlogistik/eslint-config';

export default hmlogistikEslintConfig({}, [
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
        rules: {
            'func-style': ['error', 'expression', { allowArrowFunctions: true }],
            'arrow-body-style': ['error', 'as-needed'],
        },
    },
]);
