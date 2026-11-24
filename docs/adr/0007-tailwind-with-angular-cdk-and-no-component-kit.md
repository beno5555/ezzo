# The frontend is styled with Tailwind and Angular CDK, and uses no component kit

Ezzo's look must be its own, and the product's name and brand were still open when the pages had to start. The frontend therefore uses Tailwind v4 for every look and Angular CDK for the behaviour that is hard to write well (overlays, dialogs, menus, focus trapping), and installs no ready-made component kit. Every colour, size and radius is a design token named by its role, so a brand or a second theme is another set of values for the same names and no component changes.

## Considered Options

- **Angular Material**: the fastest way to get tables, dialogs and forms. Rejected, because it looks like Material, and bending it into another identity means fighting its theming on every component.
- **PrimeNG**: rich admin tables. Rejected, because it is a large dependency to vet on Angular 22 without zone.js before the deadline, and it brings a look of its own.
- **Plain CSS with Angular CDK**: no styling dependency. Rejected, because it is slower to write, and hand-written CSS drifts between tickets built by different agent sessions.

## Consequences

- Every component's look is ours to build, including buttons, inputs and tables. Nothing arrives styled.
- Tailwind classes sit in the templates and make them longer. A look that is used twice becomes a shared component, so each class list is written once.
- The design tokens live in two files that must agree: the Tailwind theme block, which the build reads, and `DESIGN.md`, which people and agents read. A design token changes in both in the same commit.
- A component never names a theme or a brand. Light and dark, and any later skin, are values of the same role names.
