import { Language } from './language';
import { pluralize } from './pluralize';

// The source dictionary: every text the interface owns, in English. Every other language is typed
// against it (see Dictionary), so a key missing from another file fails the build.
//
// Shape: top-level groups are areas, named after the feature folder (users, posts, ...) or the core
// piece (languages, httpFailures, notFound) that shows them. Inside a feature, texts group by page or
// component. Keys are camelCase and name the text's role (title, submitButton), not its wording.
// An entry that needs a number is a function; a plural goes through pluralize.
export const english = {
  app: {
    name: 'WebCity',
  },
  languages: {
    // Each language is named in itself, so the switch reads the same in every language.
    ownName: 'English',
    switchLabel: 'Language',
  },
  themes: {
    switchLabel: 'Theme',
    light: 'Light',
    dark: 'Dark',
  },
  // Failures that bring no message of their own (see toAppResult). Server messages stay English (ADR 0006).
  httpFailures: {
    validation: 'Some fields are not valid.',
    unauthorized: 'Please sign in to continue.',
    forbidden: 'You are not allowed to do this.',
    notFound: 'This was not found.',
    network: 'Could not reach WebCity. Check your connection and try again.',
    unexpected: 'Something went wrong. Please try again.',
  },
  notFound: {
    title: 'Page not found',
    message: 'There is nothing at this address.',
    homeLink: 'Go to the home page',
  },
  // The bare session bar in the app shell. Ticket 07's shell replaces it.
  session: {
    signedInAs: (username: string) => `Signed in as ${username}`,
    signOutButton: 'Sign out',
    signInLink: 'Sign in',
  },
  // The bare live summary in the app shell, which proves the hub connection. Ticket 07's shell replaces it.
  live: {
    label: 'Live status',
    unreadConversations: (count: number) =>
      pluralize(Language.English, count, {
        one: `${count} conversation with unread messages`,
        other: `${count} conversations with unread messages`,
      }),
    onlineFriends: 'Online friends:',
    noFriendsOnline: 'No friends online',
  },
  // The Button's looks, shown in the app shell to prove the design tokens. Ticket 07's shell removes them.
  buttonSamples: {
    label: 'Button samples',
    primary: 'Primary',
    quiet: 'Quiet',
    danger: 'Danger',
    disabled: 'Disabled',
  },
  // The building blocks in shared/ that every page uses.
  shared: {
    dialog: {
      closeButton: 'Close',
    },
    confirmation: {
      cancelButton: 'Cancel',
      // Followed by the word to type, in bold.
      typedWordPrompt: 'To confirm, type',
    },
    menu: {
      buttonLabel: 'More actions',
    },
    toasts: {
      regionLabel: 'Notifications',
    },
  },
  // The shared blocks, shown in the app shell to prove them. Ticket 07's shell removes them.
  blockSamples: {
    label: 'Building block samples',
    toastButton: 'Show a toast',
    toastMessage: 'Could not like the post. Please try again.',
    linkToastButton: 'Show a toast with a link',
    linkToastMessage: 'alice_smith sent you a message',
    fourToastsButton: 'Show four toasts',
    numberedToastMessage: (number: number) => `Toast number ${number}`,
    dialogButton: 'Open a dialog',
    dialogTitle: 'A dialog',
    dialogMessage:
      'The keyboard focus stays inside this box. Escape, a click outside or the close button closes it.',
    dialogInputLabel: 'Something to type',
    confirmationButton: 'Ask for a confirmation',
    confirmationQuestion: 'Delete this post?',
    confirmationDetail: 'The post and its comments are deleted for good.',
    confirmationConfirm: 'Delete',
    typedConfirmationButton: 'Ask for a typed confirmation',
    typedConfirmationQuestion: 'Delete your account?',
    typedConfirmationDetail: 'Your account is deleted, and you are signed out.',
    typedConfirmationConfirm: 'Delete my account',
    answeredYes: 'You answered yes.',
    answeredNo: 'You answered no.',
    menuLabel: 'Actions for the sample post',
    menuReport: 'Report',
    menuEdit: 'Edit',
    menuDelete: 'Delete',
    chosen: (entry: string) => `You chose ${entry}.`,
    avatarsLabel: 'Profile pictures',
  },
  auth: {
    signIn: {
      title: 'Sign in',
      identifierLabel: 'Username or email',
      passwordLabel: 'Password',
      submitButton: 'Sign in',
    },
  },
  admin: {
    users: {
      title: 'Users',
    },
  },
  users: {
    search: {
      label: 'Search users',
      submitButton: 'Search',
      shown: (count: number) =>
        pluralize(Language.English, count, {
          one: `Showing ${count} user`,
          other: `Showing ${count} users`,
        }),
    },
  },
};
