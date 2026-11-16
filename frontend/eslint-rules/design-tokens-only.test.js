// @ts-check
// Tests for the design token lint rule, run by `npm run lint` through Node's own test runner.
const { describe, it } = require('node:test');
const { RuleTester } = require('eslint');
const css = require('@eslint/css').default;
const { templateParser } = require('angular-eslint');
const tseslint = require('typescript-eslint');
const webcity = require('./design-tokens-only');

RuleTester.describe = describe;
RuleTester.it = it;

const rule = webcity.rules['design-tokens-only'];
const typescript = new RuleTester({ languageOptions: { parser: tseslint.parser } });
const template = new RuleTester({ languageOptions: { parser: templateParser } });
const styles = new RuleTester({ plugins: { css }, language: 'css/css' });

typescript.run('design-tokens-only in a component class', rule, {
  valid: [
    "const classes = 'bg-surface-raised text-ink-strong md:p-4';",
    "const host = { '[class]': 'classes()' };",
    "const selector = 'button[appButton], a[appButton]';",
    "const query = '(prefers-color-scheme: dark)';",
    'const look = `border-${name} p-4`;',
    // An attribute selector is not a Tailwind class: only [prop:value] and [variant]: are.
    "const root = document.querySelector('[data-theme]');",
    "const root = document.querySelector('[data-theme=dark]');",
  ],
  invalid: [
    { code: "const colour = '#2b59c3';", errors: [{ messageId: 'hexColour' }] },
    { code: "const shadow = 'rgb(0 0 0 / 0.1)';", errors: [{ messageId: 'colourFunction' }] },
    { code: "const classes = 'p-[13px]';", errors: [{ messageId: 'bracketedValue' }] },
    { code: "const classes = 'p-(--gap)';", errors: [{ messageId: 'bracketedValue' }] },
    { code: "const classes = '[mask-type:luminance]';", errors: [{ messageId: 'bracketedValue' }] },
    { code: 'const classes = `md:dark:bg-surface-page`;', errors: [{ messageId: 'darkClass' }] },
  ],
});

template.run('design-tokens-only in a template', rule, {
  valid: [
    '<div class="bg-surface-page text-ink-strong lg:flex"></div>',
    '<input #feed type="search" />',
    '<a href="#top">Top</a>',
    '<li [class.font-semibold]="items[0] === user">{{ user }}</li>',
    "<div [class]=\"isOpen ? 'p-4' : 'p-2'\"></div>",
    // Only class attributes hold styles: other text may carry a # or brackets.
    '<p title="Post #123 was removed">x</p>',
    '<p [attr.title]="\'Post #123\'">x</p>',
    '<div [attr.data-theme]="theme()"></div>',
  ],
  invalid: [
    { code: '<p class="text-[#fff]">x</p>', errors: [{ messageId: 'hexColour' }] },
    {
      code: '<p class="fill-[oklch(0.5_0.1_200)]">x</p>',
      errors: [{ messageId: 'colourFunction' }],
    },
    { code: '<p style="padding: 13px">x</p>', errors: [{ messageId: 'inlineStyle' }] },
    { code: '<p style="color: #fff">x</p>', errors: [{ messageId: 'inlineStyle' }] },
    { code: '<p [style]="styles">x</p>', errors: [{ messageId: 'inlineStyle' }] },
    { code: '<p [style.width.px]="13">x</p>', errors: [{ messageId: 'inlineStyle' }] },
    { code: '<p [attr.style]="styles">x</p>', errors: [{ messageId: 'inlineStyle' }] },
    { code: '<p [ngClass]="\'p-[13px]\'">x</p>', errors: [{ messageId: 'bracketedValue' }] },
    { code: '<p [class.p-[13px]]="isOpen">x</p>', errors: [{ messageId: 'bracketedValue' }] },
    { code: '<p class="p-[13px]">x</p>', errors: [{ messageId: 'bracketedValue' }] },
    { code: '<p class="[&>svg]:size-5">x</p>', errors: [{ messageId: 'bracketedValue' }] },
    { code: '<p class="dark:bg-surface-raised">x</p>', errors: [{ messageId: 'darkClass' }] },
    {
      code: "<p [class]=\"isOpen ? 'dark:p-4' : 'p-2'\">x</p>",
      errors: [{ messageId: 'darkClass' }],
    },
  ],
});

styles.run('design-tokens-only in a component style', rule, {
  valid: [':host { display: block; }', '#feed { display: grid; }'],
  invalid: [
    { code: 'p { color: #2b59c3; }', errors: [{ messageId: 'hexColour' }] },
    { code: 'p { color: rgba(0, 0, 0, 0.5); }', errors: [{ messageId: 'colourFunction' }] },
    { code: 'p { @apply p-4; }', errors: [{ messageId: 'apply' }] },
  ],
});
