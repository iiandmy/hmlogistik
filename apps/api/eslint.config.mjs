import hmlogistikEslintConfig from '@hmlogistik/eslint-config';

export default hmlogistikEslintConfig({ react: false }, [
    {
        files: ['**/*.ts'],
        rules: {
            'ts/consistent-type-imports': 'off',
        },
    },
]);
