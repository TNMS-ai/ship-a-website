/**
 * stylelint-plugin-bem — site/bem-hierarchy rule
 *
 * Enforces that any CSS rule targeting a BEM element (.block__element) must
 * include the block root class (.block) somewhere in the full selector.
 * This prevents bare `.block__element { }` rules and partial chains that
 * omit the root block, both of which have weaker specificity guarantees.
 *
 * Good:  .field-notes .field-notes__list .field-notes__item { }
 * Bad:   .field-notes__item { }          ← no .field-notes ancestor in selector
 * Bad:   .field-notes__list .field-notes__item { }  ← missing .field-notes root
 */

import stylelint from 'stylelint';

const ruleName = 'site/bem-hierarchy';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (elemClass, blockClass) =>
    `BEM element "${elemClass}" must appear within a "${blockClass}" block context in the selector.`,
});

const meta = { url: 'https://github.com/your-org/ship-a-website' };

// Matches .block__element (with optional --modifier suffix).
const ELEM_PATTERN =
  /\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)__([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?/g;

function rule(primaryOption) {
  return (root, result) => {
    if (!primaryOption) return;

    root.walkRules((ruleNode) => {
      // Handle comma-separated selector lists individually.
      const selectors = ruleNode.selectors ?? [ruleNode.selector];

      for (const selector of selectors) {
        ELEM_PATTERN.lastIndex = 0;
        const reported = new Set();
        let match;

        while ((match = ELEM_PATTERN.exec(selector)) !== null) {
          const elemClass = match[0];
          const blockName = match[1];

          if (reported.has(blockName)) continue;

          // .block must appear somewhere in the selector as a complete class
          // token. Optionally allow a --modifier suffix (still the same block),
          // but reject a longer class that merely starts with the block name
          // (e.g. .navy must not satisfy .nav, .nav-item must not satisfy .nav).
          const escaped = blockName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const blockPresent = new RegExp(
            `\\.${escaped}(?:--[a-z][a-z0-9-]*)?(?![a-z0-9_-])`,
          ).test(selector);

          if (!blockPresent) {
            reported.add(blockName);
            stylelint.utils.report({
              message: messages.rejected(elemClass, `.${blockName}`),
              node: ruleNode,
              result,
              ruleName,
              word: elemClass,
            });
          }
        }
      }
    });
  };
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default stylelint.createPlugin(ruleName, rule);
