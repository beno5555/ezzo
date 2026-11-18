// What one run of the screenshot command photographs, as read from its command line.
export type ScreenshotRequest = {
  // Addresses of the running app, such as /sign-in.
  appPaths: string[];
  // Outside public addresses, such as https://example.com, photographed with no theme or language.
  outsideAddresses: string[];
  // Whether the app addresses are photographed signed in as the development account.
  signedIn: boolean;
};
