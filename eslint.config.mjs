/**
 * ESLint flat config — BEM + inline-style enforcement
 *
 * Rules enforced across all Astro components and pages:
 *   1. site/bem-class-pattern  — static class= strings must use BEM for any
 *        class that is not a Tailwind utility
 *   2. site/no-inline-style    — style= attributes must only inject CSS custom
 *        properties (--variable: value); plain CSS property values are banned
 *
 * noInlineConfig: true means // eslint-disable comments are lint errors.
 * Fix the violation; don't silence it.
 */

import eslintPluginAstro from 'eslint-plugin-astro';
import * as typescriptParser from '@typescript-eslint/parser';

// ── Tailwind utility heuristic ────────────────────────────────────────────────
const TAILWIND_PREFIX =
  /^(text|bg|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min|max|flex|grid|gap|space|items|justify|self|align|col|row|overflow|opacity|shadow|ring|transition|duration|ease|animate|font|tracking|leading|whitespace|break|place|z|not|dark|prose|group|peer|sr|inset|top|right|bottom|left|rounded|divide|list|grow|shrink|basis|aspect|scroll|snap|touch|filter|blur|brightness|grayscale|drop|sepia|backdrop|mix|isolation|table|caption|float|clear|underline|uppercase|lowercase|capitalize|italic|truncate|indent|antialiased|last|first|even|odd|object|cursor|pointer|select|appearance|resize|outline|accent|caret|content|columns|will|overscroll|visible|invisible|static|fixed|relative|absolute|sticky|hidden|block|inline|contents)-/;

const BEM_PATTERN =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$/;

function isTailwindClass(cls) {
  if (!cls.includes('-')) return true;
  if (cls.includes(':')) return true;
  if (cls.startsWith('[')) return true;
  if (cls.startsWith('!')) return true;
  if (TAILWIND_PREFIX.test(cls)) return true;
  if (cls.startsWith('-') && TAILWIND_PREFIX.test(cls.slice(1))) return true;
  return false;
}

function allDeclsAreCssCustomProps(text) {
  return text.trim().split(';').every(decl => {
    const trimmed = decl.trim();
    return !trimmed || trimmed.startsWith('--');
  });
}

function isCssPropInjectionOnly(node) {
  if (!node) return true;
  if (node.type === 'Literal') {
    if (node.value == null) return true;
    return typeof node.value === 'string' && allDeclsAreCssCustomProps(node.value);
  }
  if (node.type === 'TemplateLiteral') {
    const text = node.quasis.map(q => q.value.raw).join('');
    return allDeclsAreCssCustomProps(text);
  }
  if (node.type === 'Identifier') {
    return node.name === 'undefined' || node.name === 'null';
  }
  if (node.type === 'ConditionalExpression') {
    return (
      isCssPropInjectionOnly(node.consequent) &&
      isCssPropInjectionOnly(node.alternate)
    );
  }
  return false;
}

const sitePlugin = {
  rules: {
    'bem-class-pattern': {
      meta: { type: 'suggestion', schema: [] },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'class') return;
            if (node.value?.type !== 'Literal') return;

            const classes = String(node.value.value).trim().split(/\s+/);
            for (const cls of classes) {
              if (!cls || isTailwindClass(cls)) continue;
              if (!BEM_PATTERN.test(cls)) {
                context.report({
                  node,
                  message: `Class "${cls}" must follow BEM: block, block__element, block--modifier, or block__element--modifier. Tailwind utilities are exempt.`,
                });
              }
            }
          },
        };
      },
    },

    'no-inline-style': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'style') return;
            if (!node.value) return;

            const expr =
              node.value.type === 'JSXExpressionContainer'
                ? node.value.expression
                : node.value;

            if (isCssPropInjectionOnly(expr)) return;

            context.report({
              node,
              message:
                'Inline style= must only inject CSS custom properties ' +
                '(--variable: value). Move static styles to a CSS class; ' +
                'use style={`--prop: ${value}`} for dynamic token passing.',
            });
          },
        };
      },
    },
  },
};

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
      },
    },
  },

  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },

  {
    files: [
      'src/components/**/*.astro',
      'src/layouts/PageLayout.astro',
      'src/pages/**/*.astro',
    ],
    plugins: { site: sitePlugin },
    rules: {
      'site/bem-class-pattern': 'error',
      'site/no-inline-style': 'error',
    },
  },
];
