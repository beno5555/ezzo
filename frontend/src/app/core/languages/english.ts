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
    // What a form field shows under itself once it was touched (fieldErrorMessage). The server's own
    // messages are shown as they arrive instead.
    formField: {
      errors: {
        required: 'Fill in this field.',
        minLength: (length: number) =>
          pluralize(Language.English, length, {
            one: `Use at least ${length} character.`,
            other: `Use at least ${length} characters.`,
          }),
        maxLength: (length: number) =>
          pluralize(Language.English, length, {
            one: `Use at most ${length} character.`,
            other: `Use at most ${length} characters.`,
          }),
        usernameCharacters: 'Use letters, digits, _ and -, with at least one letter.',
        emailFormat: 'Enter an email address, like name@example.com.',
        futureDate: 'The date of birth cannot be in the future.',
        tooYoung: (minAge: number) =>
          pluralize(Language.English, minAge, {
            one: `You must be at least ${minAge} year old.`,
            other: `You must be at least ${minAge} years old.`,
          }),
        tooOld: (maxAge: number) =>
          pluralize(Language.English, maxAge, {
            one: `Enter an age of ${maxAge} year or less.`,
            other: `Enter an age of ${maxAge} years or less.`,
          }),
        invalid: 'This value is not valid.',
      },
    },
  },
  // The account pages: sign-in, register, forgotten password, reset and reactivation.
  auth: {
    // The name of the links under each form that lead to the other account pages.
    linksLabel: 'Other account pages',
    signIn: {
      title: 'Sign in',
      lead: 'Welcome back.',
      identifierLabel: 'Username or email',
      passwordLabel: 'Password',
      forgotPasswordLink: 'Forgot password?',
      submitButton: 'Sign in',
      registerPrompt: 'New here?',
      registerLink: 'Create an account',
      reactivatePrompt: 'Deactivated your account?',
      reactivateLink: 'Reactivate it',
      // By SignInNotice: what another page sent the user here after.
      notices: {
        accountCreated: 'Your account was created. Sign in to continue.',
        accountReactivated: 'Your account is active again. Sign in to continue.',
        passwordReset: 'Your password was changed. Sign in with the new one.',
      },
    },
    // The link back to sign-in under the other forms, after each page's own prompt.
    signInLink: 'Sign in',
    // Under a new password's field, on register and on reset.
    passwordHint: (min: number) =>
      pluralize(Language.English, min, {
        one: `At least ${min} character.`,
        other: `At least ${min} characters.`,
      }),
    register: {
      title: 'Create an account',
      lead: 'It takes a minute.',
      usernameLabel: 'Username',
      usernameHint: (min: number, max: number) =>
        `${min} to ${max} characters: letters, digits, _ and -.`,
      emailLabel: 'Email',
      passwordLabel: 'Password',
      dateOfBirthLabel: 'Date of birth',
      bioLabel: 'Bio (optional)',
      bioHint: (max: number) =>
        pluralize(Language.English, max, {
          one: `A line about you, up to ${max} character.`,
          other: `A line about you, up to ${max} characters.`,
        }),
      submitButton: 'Create account',
      signInPrompt: 'Already have an account?',
    },
    forgotPassword: {
      title: 'Forgot your password?',
      lead: "Enter your account's email, and we will send you a link to choose a new password.",
      emailLabel: 'Email',
      submitButton: 'Send the link',
      sent: (email: string) => `We sent a link to ${email}. Open it to choose a new password.`,
      signInPrompt: 'Remembered it?',
    },
    resetPassword: {
      title: 'Choose a new password',
      lead: 'Your new password replaces the old one at once.',
      passwordLabel: 'New password',
      submitButton: 'Change password',
      // When the address carries no token: the link was cut short on its way here.
      missingToken: 'This link is incomplete. Ask for a new one below.',
      newLinkPrompt: 'Link no longer works?',
      newLinkLink: 'Ask for a new one',
      signInPrompt: 'Remembered it?',
    },
    reactivate: {
      title: 'Reactivate your account',
      lead: 'We will email you a code that turns your account back on.',
      emailLabel: 'Email',
      requestButton: 'Send the code',
      codeSent: (email: string) => `We sent a code to ${email}. Paste it below.`,
      codeLabel: 'Code from the email',
      activateButton: 'Reactivate',
      otherEmailButton: 'Use another email',
      signInPrompt: 'Account still active?',
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
