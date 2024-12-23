import { describe, expect, it } from 'vitest';
import {
  buildFromOxlintConfig,
  buildFromOxlintConfigFile,
} from './build-from-oxlint-config.js';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import type { Linter } from 'eslint';
import { typescriptRulesExtendEslintRules } from '../scripts/constants.js';

describe('buildFromOxlintConfig', () => {
  describe('rule values', () => {
    it('detect active rules inside "rules" scope', () => {
      for (const ruleSetting of [
        'error',
        ['error'],
        'warn',
        ['warn'],
        1,
        [1],
        2,
        [2],
      ]) {
        const rules = buildFromOxlintConfig({
          rules: {
            eqeqeq: ruleSetting,
          },
        });

        expect(rules.length).toBe(1);
        expect(rules[0].rules).not.toBeUndefined();
        expect('eqeqeq' in rules[0].rules!).toBe(true);
        expect(rules[0].rules!.eqeqeq).toBe('off');
      }
    });

    it('skip deactive rules inside "rules" scope', () => {
      for (const ruleSetting of ['off', ['off'], 0, [0]]) {
        const rules = buildFromOxlintConfig({
          rules: {
            eqeqeq: ruleSetting,
          },
        });

        expect(rules.length).toBe(1);
        expect(rules[0].rules).not.toBeUndefined();
        expect('eqeqeq' in rules[0].rules!).toBe(false);
      }
    });

    it('skip invalid rules inside "rules" scope', () => {
      for (const ruleSetting of ['on', ['on'], 3, [3]]) {
        const rules = buildFromOxlintConfig({
          rules: {
            eqeqeq: ruleSetting,
          },
        });

        expect(rules.length).toBe(1);
        expect(rules[0].rules).not.toBeUndefined();
        expect('eqeqeq' in rules[0].rules!).toBe(false);
      }
    });
  });

  it('skip deactivate categories', () => {
    expect(
      buildFromOxlintConfig({
        categories: {
          // correctness is the only category on by default
          correctness: 'off',
        },
      })
    ).toStrictEqual([
      {
        name: 'oxlint/from-oxlint-config',
        rules: {},
      },
    ]);
  });

  it('default plugins (react, unicorn, typescript), default categories', () => {
    // snapshot because it can change with the next release
    expect(buildFromOxlintConfig({})).toMatchSnapshot(
      'defaultPluginDefaultCategories'
    );
  });

  it('custom plugins, default categories', () => {
    // snapshot because it can change with the next release
    expect(
      buildFromOxlintConfig({
        plugins: ['unicorn'],
      })
    ).toMatchSnapshot('customPluginDefaultCategories');
  });

  it('custom plugins, custom categories', () => {
    // snapshot because it can change with the next release
    expect(
      buildFromOxlintConfig({
        plugins: ['import'],
        categories: {
          nursery: 'warn',
          correctness: 'off',
        },
      })
    ).toMatchSnapshot('customPluginCustomCategories');
  });

  it('skip deactivate rules, for custom enable category', () => {
    const rules = buildFromOxlintConfig({
      plugins: ['import'],
      categories: {
        nursery: 'warn',
        correctness: 'off',
      },
      rules: {
        'import/no-unused-modules': 'off',
      },
    });
    expect('import/no-unused-modules' in rules).toBe(false);
  });
});

const createConfigFileAndBuildFromIt = (
  filename: string,
  content: string
): Linter.Config<Record<string, 'off'>>[] => {
  fs.writeFileSync(filename, content);

  const rules = buildFromOxlintConfigFile(filename);

  fs.unlinkSync(filename);

  return rules;
};

describe('buildFromOxlintConfigFile', () => {
  it('successfully parse oxlint json config', () => {
    const rules = createConfigFileAndBuildFromIt(
      'success-config.json',
      `{
        "rules": {
          // hello world
          "no-await-loop": "error",
        },
      }`
    );

    expect(rules.length).toBe(1);
    expect(rules[0].rules).not.toBeUndefined();
    expect('no-await-loop' in rules[0].rules!).toBe(true);
  });

  it('fails to find oxlint config', () => {
    const rules = buildFromOxlintConfigFile('not-found.json');

    expect(rules).toStrictEqual([
      {
        name: 'oxlint/from-oxlint-config',
      },
    ]);
  });

  it('fails to parse invalid json', () => {
    const rules = createConfigFileAndBuildFromIt(
      'invalid-json.json',
      '["this", is an invalid json format]'
    );

    expect(rules).toStrictEqual([
      {
        name: 'oxlint/from-oxlint-config',
      },
    ]);
  });

  it('fails to parse invalid oxlint config', () => {
    const rules = createConfigFileAndBuildFromIt(
      'invalid-config.json',
      JSON.stringify(['this is valid json but not an object'])
    );

    expect(rules).toStrictEqual([
      {
        name: 'oxlint/from-oxlint-config',
      },
    ]);
  });
});

const executeOxlintWithConfiguration = (
  filename: string,
  config: {
    [key: string]: unknown;
    plugins?: string[];
    categories?: Record<string, unknown>;
    rules?: Record<string, unknown>;
  }
) => {
  fs.writeFileSync(filename, JSON.stringify(config));
  let oxlintOutput: string;

  const cliArguments = [
    `--config=${filename}`,
    '--disable-oxc-plugin',
    '--silent',
  ];

  // --disabled-<foo>-plugin can be removed after oxc-project/oxc#6896
  if (config.plugins !== undefined) {
    for (const plugin of ['typescript', 'unicorn', 'react']) {
      if (!config.plugins!.includes(plugin)) {
        cliArguments.push(`--disable-${plugin}-plugin`);
      }
    }
  }

  try {
    oxlintOutput = execSync(`npx oxlint ${cliArguments.join(' ')}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch {
    oxlintOutput = '';
  }

  fs.unlinkSync(filename);

  const result = /with\s(\d+)\srules/.exec(oxlintOutput);

  if (result === null) {
    return;
  }

  return Number.parseInt(result[1], 10) ?? undefined;
};

describe('integration test with oxlint', () => {
  for (const [index, config] of [
    // default
    {},
    // no plugins
    { plugins: [] },
    // simple plugin override
    { plugins: ['typescript'] },
    // custom rule off
    {
      rules: { eqeqeq: 'off' },
    },
    // combination plugin + rule
    { plugins: ['vite'], rules: { eqeqeq: 'off' } },

    // categories change
    { categories: { correctness: 'off', nusery: 'warn' } },
    // combination plugin + categires + rules
    {
      plugins: ['vite'],
      categories: { correctness: 'off', style: 'warn' },
      rules: { eqeqeq: 'off' },
    },
    // all categories enabled
    {
      categories: {
        correctness: 'warn',
        nursery: 'off', // enable after oxc-project/oxc#7073
        pedantic: 'warn',
        perf: 'warn',
        restriction: 'warn',
        style: 'warn',
        suspicious: 'warn',
      },
    },
    // all plugins enabled
    {
      plugins: [
        'typescript',
        'unicorn',
        'react',
        'react-perf',
        'nextjs',
        'import',
        'jsdoc',
        'jsx-a11y',
        'n',
        'promise',
        'jest',
        'vitest',
        'tree_shaking',
      ],
    },
    // everything on
    {
      plugins: [
        'typescript',
        'unicorn',
        'react',
        'react-perf',
        'nextjs',
        'import',
        'jsdoc',
        'jsx-a11y',
        'n',
        'promise',
        'jest',
        'vitest',
        'tree_shaking',
      ],
      categories: {
        correctness: 'warn',
        nursery: 'off', // enable after oxc-project/oxc#7073
        pedantic: 'warn',
        perf: 'warn',
        restriction: 'warn',
        style: 'warn',
        suspicious: 'warn',
      },
    },
  ].entries()) {
    const fileContent = JSON.stringify(config);

    it(`should output same rule count for: ${fileContent}`, () => {
      const oxlintRulesCount = executeOxlintWithConfiguration(
        `integration-test-${index}-oxlint.json`,
        config
      );

      const eslintRules = buildFromOxlintConfig(config);

      expect(eslintRules.length).toBe(1);
      expect(eslintRules[0].rules).not.toBeUndefined();

      let expectedCount = oxlintRulesCount ?? 0;

      // special mapping for ts alias rules
      if (
        config.plugins === undefined ||
        config.plugins.includes('typescript')
      ) {
        expectedCount += typescriptRulesExtendEslintRules.filter(
          (aliasRule) => aliasRule in eslintRules[0].rules!
        ).length;
      }

      expect(Object.keys(eslintRules[0].rules!).length).toBe(expectedCount);
    });
  }
});
