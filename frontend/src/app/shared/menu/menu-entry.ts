// One entry of a "…" menu, given by the caller. label comes from the caller's dictionary; a destructive
// entry (Delete) is marked in danger; choose runs when the entry is chosen, by click or by keyboard.
export type MenuEntry = {
  label: string;
  isDestructive: boolean;
  choose: () => void;
};
