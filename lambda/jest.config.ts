/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	reporters: [
		'default',
		[ 'jest-junit', {
			outputDirectory: './../test-reports',
			outputName: 'api-reports.xml',
		} ]
	],
	extensionsToTreatAsEsm: ['.ts'],
	// taken from https://kulshekhar.github.io/ts-jest/docs/getting-started/options
	transform: {
		// '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
		// '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
};
