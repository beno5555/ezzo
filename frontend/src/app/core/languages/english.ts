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
  // Each page's name, by its route's title key (app.routes.ts). PageTitleStrategy puts it in the
  // browser tab as "<page> – WebCity".
  pages: {
    home: 'Home',
    feed: 'Feed',
    signIn: 'Sign in',
    register: 'Register',
    forgotPassword: 'Forgot password',
    resetPassword: 'Choose a new password',
    reactivateAccount: 'Reactivate your account',
    post: 'Post',
    profile: 'Profile',
    search: 'Search',
    settings: 'Settings',
    friends: 'Friends',
    messages: 'Messages',
    conversation: 'Conversation',
    adminUsers: 'Users',
    adminReports: 'Reports',
    adminModeration: 'Moderation queue',
    adminLogs: 'Logs',
    adminStatistics: 'Statistics',
    notFound: 'Page not found',
  },
  // A page whose route exists before the page is built; its ticket replaces it.
  pagePlaceholder: {
    message: 'This page is not ready yet.',
  },
  // The shell around every page: the top bar, the phone's bottom bar and the menus in them (core/shell).
  shell: {
    navigationLabel: 'Main',
    feedLink: 'Feed',
    friendsLink: 'Friends',
    messagesLink: 'Messages',
    // The phone's bottom bar gives each link a fifth of 360 px, so its words are the shortest that still
    // say where the link leads.
    bottomBar: {
      feedLink: 'Feed',
      searchLink: 'Search',
      friendsLink: 'Friends',
      messagesLink: 'Messages',
      profileLink: 'Profile',
    },
    searchLabel: 'Search users',
    searchButton: 'Search',
    userMenuLabel: 'Your menu',
    preferencesMenuLabel: 'Language and theme',
    signedInAs: 'Signed in as',
    myProfileLink: 'My profile',
    settingsLink: 'Settings',
    adminLink: 'Admin',
    signOutButton: 'Sign out',
    signInLink: 'Sign in',
    registerLink: 'Register',
    // Read by screen readers after the link's name; the badge itself shows only the number.
    unreadBadge: (badge: string) => `${badge} unread`,
    waitingBadge: (badge: string) => `${badge} waiting`,
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
