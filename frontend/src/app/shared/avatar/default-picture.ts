// The eight disc design tokens as ring classes, written out whole so that Tailwind finds each class in
// this file.
const ringClasses = [
  'border-disc-1',
  'border-disc-2',
  'border-disc-3',
  'border-disc-4',
  'border-disc-5',
  'border-disc-6',
  'border-disc-7',
  'border-disc-8',
] as const;
const unavailableRingClass = 'border-disc-unavailable';

// The ring of the default profile picture (DESIGN.md, Components): the colour of its outline. The inside
// is the same faceless silhouette for everyone. The colour follows the id, not the username, so it
// survives a change of username. An unavailable account (deactivated or deleted) gets the grey ring.
export function ringClass(userId: number, isUnavailable: boolean): string {
  const ring = isUnavailable ? unavailableRingClass : ringClasses[userId % ringClasses.length];

  return ring;
}
