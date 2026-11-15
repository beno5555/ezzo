import { appAddresses } from './app-addresses';

// A stand-in origin to resolve the wanted address against. Any address that resolves to another origin
// (https://…, //host, /\host, which browsers read as //host) leaves the app.
const probeOrigin = 'https://webcity.invalid';

// The address sign-in returns to: the wanted one when it is inside the app, the home address otherwise,
// so that a crafted sign-in link cannot send the user to another site.
export function toReturnAddress(wanted: string | undefined): string {
  let returnAddress: string = appAddresses.home;

  const isRootRelative = wanted !== undefined && wanted.startsWith('/');
  if (isRootRelative) {
    const staysInApp = URL.parse(wanted, probeOrigin)?.origin === probeOrigin;
    if (staysInApp) {
      returnAddress = wanted;
    }
  }

  return returnAddress;
}
