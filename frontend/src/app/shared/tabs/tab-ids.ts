// The ids that tie a tab to its panel: the tab names the panel it controls (aria-controls), and the panel
// the tab that labels it (aria-labelledby). The prefix tells apart two sets of tabs on one page.
export function tabId(idPrefix: string, tabKey: string): string {
  return `${idPrefix}-tab-${tabKey}`;
}

export function panelId(idPrefix: string, tabKey: string): string {
  return `${idPrefix}-panel-${tabKey}`;
}
