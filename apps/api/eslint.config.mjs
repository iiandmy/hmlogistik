import hmlogistikEslintConfig from '@hmlogistik/eslint-config';

export default hmlogistikEslintConfig(
    {
        files: ['**/*.ts'],
        rules: {
            'ts/consistent-type-imports': 'off',
        },
    },
);
