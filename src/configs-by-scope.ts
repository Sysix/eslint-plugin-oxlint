// These rules are automatically generated by scripts/generate-rules.ts

import * as rules from "./rules-by-scope.js";

const eslintConfig = {
	name: 'oxlint/eslint',
	rules: rules.eslintRules,
} as const;

const typescriptConfig = {
	name: 'oxlint/typescript',
	rules: rules.typescriptRules,
} as const;

const importConfig = {
	name: 'oxlint/import',
	rules: rules.importRules,
} as const;

const jestConfig = {
	name: 'oxlint/jest',
	rules: rules.jestRules,
} as const;

const jsdocConfig = {
	name: 'oxlint/jsdoc',
	rules: rules.jsdocRules,
} as const;

const jsxA11yConfig = {
	name: 'oxlint/jsx-a11y',
	rules: rules.jsxA11yRules,
} as const;

const nextjsConfig = {
	name: 'oxlint/nextjs',
	rules: rules.nextjsRules,
} as const;

const nodeConfig = {
	name: 'oxlint/node',
	rules: rules.nodeRules,
} as const;

const promiseConfig = {
	name: 'oxlint/promise',
	rules: rules.promiseRules,
} as const;

const reactConfig = {
	name: 'oxlint/react',
	rules: rules.reactRules,
} as const;

const reactPerfConfig = {
	name: 'oxlint/react-perf',
	rules: rules.reactPerfRules,
} as const;

const securityConfig = {
	name: 'oxlint/security',
	rules: rules.securityRules,
} as const;

const treeShakingConfig = {
	name: 'oxlint/tree-shaking',
	rules: rules.treeShakingRules,
} as const;

const unicornConfig = {
	name: 'oxlint/unicorn',
	rules: rules.unicornRules,
} as const;

const vitestConfig = {
	name: 'oxlint/vitest',
	rules: rules.vitestRules,
} as const;

export {
	eslintConfig as "flat/eslint",
	typescriptConfig as "flat/typescript",
	importConfig as "flat/import",
	jestConfig as "flat/jest",
	jsdocConfig as "flat/jsdoc",
	jsxA11yConfig as "flat/jsx-a11y",
	nextjsConfig as "flat/nextjs",
	nodeConfig as "flat/node",
	promiseConfig as "flat/promise",
	reactConfig as "flat/react",
	reactPerfConfig as "flat/react-perf",
	securityConfig as "flat/security",
	treeShakingConfig as "flat/tree-shaking",
	unicornConfig as "flat/unicorn",
	vitestConfig as "flat/vitest"
}