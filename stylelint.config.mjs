/**
 * Stylelint — BEM enforcement
 *
 * Rules:
 *   1. selector-class-pattern  — all class names must follow BEM
 *   2. site/bem-hierarchy      — every .block__element selector must include
 *        the .block ancestor class in the same compound selector
 *   3. reportDisableDirectives — stylelint-disable is itself a lint error;
 *        fix the violation instead of silencing it
 */

/** @type {import('stylelint').Config} */
export default {
  reportDisableDirectives: 'error',

  plugins: ['./scripts/stylelint-plugin-bem.mjs'],

  rules: {
    'selector-class-pattern': [
      /^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$/,
      {
        message: (cls) =>
          `"${cls}" must follow BEM: block, block__element, block--modifier, or block__element--modifier`,
        resolveNestedSelectors: true,
      },
    ],

    'site/bem-hierarchy': true,
  },
};
