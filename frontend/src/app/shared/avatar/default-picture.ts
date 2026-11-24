// The eight avatar design tokens as ring classes, written out whole so that Tailwind finds each class in
// this file.
const ringClasses = [
  'border-avatar-1',
  'border-avatar-2',
  'border-avatar-3',
  'border-avatar-4',
  'border-avatar-5',
  'border-avatar-6',
  'border-avatar-7',
  'border-avatar-8',
] as const;
const unavailableRingClass = 'border-avatar-unavailable';

// The ring of the default profile picture (DESIGN.md, Components): the colour of its outline. The inside
// is the same faceless silhouette for everyone. The colour follows the id, not the username, so it
// survives a change of username. An unavailable account (deactivated or deleted) gets the grey ring.
export function ringClass(userId: number, isUnavailable: boolean): string {
  const ring = isUnavailable ? unavailableRingClass : ringClasses[userId % ringClasses.length];

  return ring;
}
