// The forms of one plural entry, keyed by the CLDR category that Intl.PluralRules picks.
// Every language has `other`; English and Georgian also use `one`.
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
