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
    newPost: 'Write a post',
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
    // Whether a friend is online, or when they last were (shared/presence-label, shared/presence-dot).
    // time is DateFormatter.timeSince: "5 minutes ago", "yesterday", "Nov 19".
    presence: {
      online: 'Active now',
      lastActive: (time: string) => `Active ${time}`,
    },
    // How DateFormatter writes a date: month names and the order of the parts. Written here, not by Intl,
    // because Chrome has no Georgian data for dates.
    dates: {
      monthsShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      monthsLong: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      dayMonth: (day: number, month: string) => `${month} ${day}`,
      dayMonthYear: (day: number, month: string, year: number) => `${month} ${day}, ${year}`,
      dateAndTime: (date: string, time: string) => `${date}, ${time}`,
    },
    // The day of a moment, when it is today or yesterday (DateFormatter.day).
    days: {
      today: 'Today',
      yesterday: 'Yesterday',
    },
    // How long ago something was (DateFormatter.timeSince), and the same as a count small enough for a badge
    // (shortTimeSince). Written here, not by Intl: Chrome has no Georgian data for relative times or units.
    timeSince: {
      justNow: 'just now',
      minutesAgo: (count: number) =>
        pluralize(Language.English, count, {
          one: `${count} minute ago`,
          other: `${count} minutes ago`,
        }),
      hoursAgo: (count: number) =>
        pluralize(Language.English, count, {
          one: `${count} hour ago`,
          other: `${count} hours ago`,
        }),
      yesterday: 'yesterday',
      daysAgo: (count: number) => `${count} days ago`,
      minutesShort: (count: number) => `${count}m`,
      hoursShort: (count: number) => `${count}h`,
    },
    // A post's or a message's photos: the grid of thumbnails and the full-screen viewer (shared/photos).
    photos: {
      openButton: (position: number, total: number) => `Open photo ${position} of ${total}`,
      // The last thumbnail when the grid leaves photos out: it shows moreBadge, and its label says what the
      // badge means.
      openMoreButton: (position: number, total: number, count: number) =>
        pluralize(Language.English, count, {
          one: `Open photo ${position} of ${total}, ${count} more photo`,
          other: `Open photo ${position} of ${total}, ${count} more photos`,
        }),
      moreBadge: (count: number) => `+${count}`,
      viewerLabel: 'Photos',
      photoDescription: (position: number, total: number) => `Photo ${position} of ${total}`,
      position: (position: number, total: number) => `${position} / ${total}`,
      previousButton: 'Previous photo',
      nextButton: 'Next photo',
      // The photo picker (shared/photos/photo-picker), in the composer and in the chat (ticket 19).
      addButton: 'Add photos',
      removeButton: (position: number, total: number) => `Remove photo ${position} of ${total}`,
      count: (count: number, max: number) => `${count} of ${max} photos`,
      // A picked file the browser did not add, named so that the user knows which one.
      refusals: {
        tooMany: (fileName: string, max: number) =>
          `${fileName} was not added: you can add at most ${max} photos.`,
        wrongType: (fileName: string) =>
          `${fileName} was not added: only JPEG, PNG and WebP photos can be added.`,
        tooLarge: (fileName: string, maxMegabytes: number) =>
          `${fileName} was not added: a photo can be at most ${maxMegabytes} MB.`,
      },
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
      lead: 'We will email you a link that turns your account back on.',
      emailLabel: 'Email',
      requestButton: 'Send the link',
      sent: (email: string) => `We sent a link to ${email}. Open it to reactivate your account.`,
      // Opened from the email's link: the lead above its one button.
      linkLead: 'Press the button to turn your account back on.',
      activateButton: 'Reactivate my account',
      newLinkPrompt: 'Link no longer works?',
      newLinkLink: 'Ask for a new one',
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
  posts: {
    // The post card (shared/post-card), wherever a post is listed.
    card: {
      // The button's name for screen readers; whether the caller liked it is read from aria-pressed.
      likeButton: (count: number) =>
        pluralize(Language.English, count, {
          one: `Like, ${count} like`,
          other: `Like, ${count} likes`,
        }),
      commentsLink: (count: number) =>
        pluralize(Language.English, count, {
          one: `${count} comment`,
          other: `${count} comments`,
        }),
      // In place of the like and comment controls while a new post is on its way to the server.
      uploading: 'Uploading…',
    },
    // The card on its own page (/posts/new) where a user writes a post (features/posts/post-composer).
    composer: {
      label: 'Write a post',
      titleLabel: 'Title',
      contentLabel: 'Text',
      contentHint: 'A post needs text, photos or both.',
      submitButton: 'Post',
      uploadingToast: 'Uploading your post…',
      publishedToast: 'Your post is published.',
    },
    feed: {
      // The link beside the feed's heading to the composer's page.
      writeButton: 'Write a post',
      loading: 'Loading posts…',
      loadingMore: 'Loading more posts…',
      emptyTitle: 'Nothing here yet',
      emptyMessage: 'When other people write posts, they show up here.',
      retryButton: 'Try again',
      end: 'You have reached the end of the feed.',
    },
  },
  // The chat at /messages and /messages/:username (features/messages).
  messages: {
    // The list of conversations, beside the open one on a desktop and on its own screen on a phone.
    list: {
      loading: 'Loading conversations…',
      loadingMore: 'Loading more conversations…',
      retryButton: 'Try again',
      emptyTitle: 'No conversations yet',
      emptyMessage: 'When you and a friend write to each other, the conversation shows up here.',
      // The last message when it has photos and no text.
      photo: 'Photo',
      // Before the last message when the signed-in user sent it.
      ownMessage: (preview: string) => `You: ${preview}`,
      unreadBadge: (badge: string) => `${badge} unread messages`,
    },
    // The right-hand side on a desktop while no conversation is open.
    noConversation: {
      title: 'Choose a conversation',
      message: 'Pick a friend from the list to read your messages.',
    },
    conversation: {
      backLink: 'Back to conversations',
      loading: 'Opening the conversation…',
      loadingOlder: 'Loading older messages…',
      retryButton: 'Try again',
      notFoundTitle: 'No such user',
      notFoundMessage: (username: string) => `Nobody on WebCity is called ${username}.`,
      notFriendTitle: 'You are not friends',
      notFriendMessage: (username: string) =>
        `You can write only to your friends, and ${username} is not one of them.`,
      listLink: 'See your conversations',
      profileLink: 'See their profile',
      emptyTitle: 'No messages yet',
      emptyMessage: 'Neither of you has written yet.',
      start: 'This is the beginning of your conversation.',
      historyLabel: (username: string) => `Messages with ${username}`,
      // Above the first message of a day: "Yesterday, 1:25 PM" (DateFormatter.day and clockTime).
      dayHeading: (day: string, time: string) => `${day}, ${time}`,
      // Read by screen readers before each message, which shows its sender only by its side.
      ownSender: 'You',
      senderLabel: (sender: string) => `${sender}:`,
      edited: 'Edited',
    },
  },
};
