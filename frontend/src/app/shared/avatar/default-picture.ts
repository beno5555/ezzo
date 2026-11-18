// What separates the parts of a username. The backend allows _ and - (Constants.UsernameRegexPattern);
// the dot is DESIGN.md's example (john.doe).
const partSeparator = /[._-]+/;
const initialsLength = 2;

// The eight disc design tokens, written out whole so that Tailwind finds each class in this file.
const discClasses = [
  'bg-disc-1',
  'bg-disc-2',
  'bg-disc-3',
  'bg-disc-4',
  'bg-disc-5',
  'bg-disc-6',
  'bg-disc-7',
  'bg-disc-8',
] as const;
const unavailableDiscClass = 'bg-disc-unavailable';

// The default profile picture (DESIGN.md, Components): initials, and the disc class they sit on.
export type DefaultPicture = {
  initials: string;
  discClass: string;
};

// The disc follows the id, not the username, so it survives a change of username. An unavailable
// account (deactivated or deleted) gets the grey disc with no letters.
export function defaultPicture(
  userId: number,
  username: string,
  isUnavailable: boolean,
): DefaultPicture {
  const picture: DefaultPicture = isUnavailable
    ? { initials: '', discClass: unavailableDiscClass }
    : { initials: initialsOf(username), discClass: discClasses[userId % discClasses.length] };

  return picture;
}

// A username in two parts gives the first letter of each; any other gives its first two letters.
// Backend usernames are ASCII, so upper case is safe (no Georgian letter becomes Mtavruli).
function initialsOf(username: string): string {
  const parts = username.split(partSeparator).filter((part) => part.length > 0);
  const isInTwoParts = parts.length === initialsLength;
  const initials = isInTwoParts
    ? parts.map((part) => part[0]).join('')
    : parts.join('').slice(0, initialsLength);

  return initials.toUpperCase();
}
