import config from '@iobroker/eslint-config';

// disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
config.forEach(rule => {
    if (rule?.plugins?.jsdoc) {
        rule.rules['jsdoc/require-jsdoc'] = 'off';
        rule.rules['jsdoc/require-param'] = 'off';
    }
});

export default [
    ...config,
    {
        files: ['**/*.js'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        // disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
        },
    },
    {
        // Specific rules for widget source files
        files: ['src-widgets/src/**/*.{ts,tsx,js,jsx}'],
        rules: {
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    'ts-expect-error': 'allow-with-description',
                    'ts-ignore': 'allow-with-description',
                    minimumDescriptionLength: 3,
                },
            ],
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    tabWidth: 4,
                    useTabs: false,
                    semi: true,
                    trailingComma: 'all',
                    endOfLine: 'auto',
                    printWidth: 120,
                    arrowParens: 'avoid',
                },
            ],
        },
    },
    {
        ignores: [
            'src-widgets/.__mf__temp/**/*',
            'src-widgets/build/**/*',
            'src-widgets/node_modules/**/*',
            'widgets/**/*',
            'test/**/*',
        ],
    },
];
