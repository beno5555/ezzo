// @ts-check
// The lint rule behind "design tokens only" (DESIGN.md, Do's and Don'ts; frontend ticket 27).
//
// It fails on a style value that bypasses the design tokens in src/design-tokens.css:
//   - a hex colour (#2b59c3) or a colour function (rgb(, oklch(, ...)
//   - a bracketed Tailwind value (p-[13px], [&>svg]:p-2) or its variable form (p-(--gap))
//   - a dark: class, which names a theme (the dark theme gives the same classes other values)
//   - an @apply, which builds a class outside the template
//   - an inline style in a template (style="...", [style], [style.width.px]), which no design token reaches
//
// It reads three kinds of file, each through its own parser, so it only looks where a style can be:
//   - TypeScript: string literals and template strings (a component class that builds class lists).
//     Specs, test helpers and the dictionaries hold no styles and are left out (see eslint.config.js).
//   - templates: class attributes, and the string literals inside a bound one such as [class]
//   - component styles: hex colours, colour functions and at-rules in the CSS syntax tree
// The design token file sits outside src/app, so it is the one place exempt (see eslint.config.js).

const hexColour = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/i;
const colourFunctionNames = [
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
  'color-mix',
  'light-dark',
];
const colourFunction = new RegExp(`(?<![\\w-])(?:${colourFunctionNames.join('|')})\\(`, 'i');
const applyRule = /@apply\b/;
// A class name with a bracketed value after a dash or a colon (p-[13px], md:[&>svg]:p-2), the
// variable form (p-(--gap)), or one that opens with Tailwind's arbitrary syntax: a property
// ([mask-type:luminance]) or a variant ([&>svg]:p-2). A bare attribute selector ([data-theme]) is none.
const bracketedClass = /[-:]\[[^\]]*\]|^\[[^\]]*:[^\]]*\]|^\[[^\]]*\]:|-\(--[\w-]+\)/;
// How a template attribute is written, from its source text: style="..", [style], [style.width.px],
// [attr.style]; and class="..", [class], [class.x], [ngClass].
const styleAttribute = /^\[?(?:attr\.)?style(?![\w-])/i;
const classAttribute = /^\[?(?:class|ngClass)(?![\w-])/;
// dark: as a variant, alone or after another one (md:dark:bg-surface-page).
const darkClass = /(?:^|:)dark:\S/;
// The string literals inside an Angular expression, such as [class]="isOpen ? 'p-4' : 'p-2'".
const stringLiteral = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

/** @returns {string | null} the id of the first message that the text breaks, or null */
function findBreach(text) {
  let breach = null;
  const classNames = text.split(/[\s'"`]+/);

  if (hexColour.test(text)) {
    breach = 'hexColour';
  } else if (colourFunction.test(text)) {
    breach = 'colourFunction';
  } else if (applyRule.test(text)) {
    breach = 'apply';
  } else if (classNames.some((className) => bracketedClass.test(className))) {
    breach = 'bracketedValue';
  } else if (classNames.some((className) => darkClass.test(className))) {
    breach = 'darkClass';
  }

  return breach;
}

/** @type {import('eslint').Rule.RuleModule} */
const designTokensOnly = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Allow only design tokens for colours and sizes in templates, styles and classes',
    },
    schema: [],
    messages: {
      hexColour:
        'A hex colour is not a design token. Use a colour role from DESIGN.md, such as bg-surface-raised.',
      colourFunction:
        'A colour function is not a design token. Use a colour role from DESIGN.md, such as text-ink-muted.',
      bracketedValue:
        "A bracketed Tailwind value bypasses the design tokens. Use a theme class or a step of Tailwind's spacing scale.",
      darkClass:
        'A dark: class names a theme. Use the colour role alone: the dark theme gives it its dark value.',
      apply:
        '@apply builds a class outside the template. Write the classes in the template, or make a shared component.',
      inlineStyle:
        'An inline style bypasses the design tokens. Use Tailwind classes made from the design tokens.',
    },
  },
  create(context) {
    // The node comes from any of the three parsers; ESLint reports each by its location alone.
    /** @param {import('estree').Node} node @param {string | null | undefined} text */
    function check(node, text) {
      const hasText = typeof text === 'string';
      const breach = hasText ? findBreach(text) : null;
      const isBreach = breach !== null;
      if (isBreach) {
        context.report({ node, messageId: breach });
      }
    }

    // A template attribute, told apart by how it is written: an inline style always breaks the rule,
    // a class attribute is checked, and any other attribute holds no style.
    /** @param {import('estree').Node & { sourceSpan?: unknown }} node an Angular template node @param {string} classText */
    function checkAttribute(node, classText) {
      const written = String(node.sourceSpan);
      const isInlineStyle = styleAttribute.test(written);
      const isClassAttribute = classAttribute.test(written);
      if (isInlineStyle) {
        context.report({ node, messageId: 'inlineStyle' });
      } else if (isClassAttribute) {
        check(node, classText);
      }
    }

    return {
      // TypeScript. An object key holds no style: host: { '[class]': ... } is an Angular binding name.
      Literal(node) {
        const isObjectKey = node.parent?.type === 'Property' && node.parent.key === node;
        const holdsStyle = typeof node.value === 'string' && !isObjectKey;
        check(node, holdsStyle ? node.value : null);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },

      // Angular templates. Only a class attribute holds styles; any other text may carry a # or brackets.
      TextAttribute(node) {
        checkAttribute(node, node.value);
      },
      BoundAttribute(node) {
        // The class name of [class.x], and the string literals of the expression.
        const source = node.value?.source ?? '';
        const literals = [...source.matchAll(stringLiteral)].map(
          (match) => match[1] ?? match[2] ?? match[3],
        );
        checkAttribute(node, [node.name, ...literals].join(' '));
      },

      // Component styles (@eslint/css). An id selector is an IdSelector node, so Hash is always a colour.
      Hash(node) {
        context.report({ node, messageId: 'hexColour' });
      },
      Function(node) {
        if (colourFunctionNames.includes(node.name.toLowerCase())) {
          context.report({ node, messageId: 'colourFunction' });
        }
      },
      Atrule(node) {
        if (node.name.toLowerCase() === 'apply') {
          context.report({ node, messageId: 'apply' });
        }
      },
    };
  },
};

module.exports = { rules: { 'design-tokens-only': designTokensOnly } };
