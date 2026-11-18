import type { AppShot } from './app-shot.ts';

// Widths are padded to four digits, so that 0360 sorts before 0768 and 1280.
const widthDigits = 4;
const imageExtension = '.png';
// The name of the home address, /, whose path is empty once the slashes go.
const homeName = 'home';
// Every run of characters outside this set becomes one underscore: a Windows file name holds no / ? : * " < > |.
const unsafeCharacters = /[^A-Za-z0-9.=-]+/g;
const edgeUnderscores = /^_+|_+$/g;

// The file name of one image of an app address, such as sign-in--guest--0360-dark-ka.png. The address
// comes first, so the images of one address sort together.
export function appImageName(shot: AppShot): string {
  const state = shot.signedIn ? 'signed-in' : 'guest';
  return `${addressName(shot.path)}--${state}--${widthName(shot.width)}-${shot.theme}-${shot.language}${imageExtension}`;
}

// The file name of one image of an outside address, such as example.com_about--0360.png.
export function outsideImageName(address: string, width: number): string {
  const url = new URL(address);
  return `${addressName(url.host + url.pathname + url.search)}--${widthName(width)}${imageExtension}`;
}

function widthName(width: number): string {
  return String(width).padStart(widthDigits, '0');
}

function addressName(address: string): string {
  const name = address.replace(unsafeCharacters, '_').replace(edgeUnderscores, '');
  return name === '' ? homeName : name;
}
