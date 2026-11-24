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
    name: 'Ezzo',
  },
  languages: {
    switchLabel: 'Language',
    switchFailed: 'Could not load the language. Reload the page and try again.',
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
    network: 'Could not reach Ezzo. Check your connection and try again.',
    unexpected: 'Something went wrong. Please try again.',
  },
  notFound: {
    title: 'Page not found',
    message: 'There is nothing at this address.',
    homeLink: 'Go to the home page',
  },
  // Each page's name, by its route's title key (app.routes.ts). PageTitleStrategy puts it in the
  // browser tab as "<page> – Ezzo".
  pages: {
    feed: 'Feed',
    register: 'Register',
    forgotPassword: 'Forgot password',
    resetPassword: 'Choose a new password',
    reactivateAccount: 'Reactivate your account',
    newPost: 'Write a post',
    editPost: 'Edit your post',
    post: 'Post',
    profile: 'Profile',
    search: 'Search',
    settings: 'Settings',
    friends: 'Friends',
    messages: 'Messages',
    adminUsers: 'Users',
    adminReports: 'Reports',
    adminModeration: 'Moderation queue',
    adminLogs: 'Audit',
    adminStatistics: 'Statistics',
    notFound: 'Page not found',
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
    // After the author's name on the reader's own post or comment, among everyone else's.
    ownMark: '(you)',
    // Shown on a post, comment, message or friend while its deletion waits for the server.
    deleting: 'Deleting…',
    dialog: {
      closeButton: 'Close',
    },
    // The eye button inside a password box; aria-pressed says whether the password shows.
    passwordToggle: {
      label: 'Show password',
    },
    // The copyable texts (a username, an email) in the admin panel.
    copy: {
      button: (value: string) => `Copy ${value}`,
      copied: 'Copied.',
      failed: 'It could not be copied.',
    },
    confirmation: {
      cancelButton: 'Cancel',
      // Followed by the word to type, in bold.
      typedWordPrompt: 'To confirm, type',
    },
    menu: {
      buttonLabel: 'More actions',
    },
    // The entries of the "…" menu on a post and on a comment (shared/content-actions), and the badge on
    // content that moderation hid.
    content: {
      editEntry: 'Edit',
      deleteEntry: 'Delete',
      hideEntry: 'Hide',
      makeVisibleEntry: 'Make visible',
      reportEntry: 'Report',
      hiddenBadge: 'Hidden',
    },
    toasts: {
      regionLabel: 'Notifications',
      dismiss: 'Dismiss',
      // The live toasts (core/hub/live-toast-store). The toast shows the person's name above these lines, as
      // its own highlighted line, so none of them holds the name. A message toast's line is the start of
      // the message, or messages.list.photo.
      live: {
        comment: 'commented on your post',
        like: 'liked your post',
        online: 'is online',
      },
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
    // The date-time picker (DateTimeInput): the weekday names, Sunday first, and the names its screen reader
    // announcements use.
    dateTimePicker: {
      weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      weekdaysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      calendarLabel: 'Calendar',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      previousYears: 'Earlier years',
      nextYears: 'Later years',
      chooseMonth: 'Choose the month, now:',
      chooseYear: 'Choose the year, now:',
      hours: 'Hours',
      minutes: 'Minutes',
      // The box's description for screen readers: its value is chosen in the calendar, and Delete clears it.
      clearHint: 'Press Delete to clear',
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
      // The photo picker (shared/photos/photo-picker), in the composer and in the chat's message box.
      addButton: 'Add photos',
      removeButton: (position: number, total: number) => `Remove photo ${position} of ${total}`,
      // The viewer's button for a picked photo; screen readers hear removeButton, which starts the same.
      removeInViewer: 'Remove',
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
        passwordMismatch: 'The passwords do not match.',
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
  // The account pages: the landing page with sign-in, register, forgotten password, reset and reactivation.
  auth: {
    // The name of the links under each form that lead to the other account pages.
    linksLabel: 'Other account pages',
    // The picture of the app beside the sign-in form: two posts that are not real.
    landingPicture: {
      pots: { author: 'nino_clay', time: '2 hours ago', title: "Three pots from Sunday's kiln" },
      quilt: { author: 'luka_k', time: 'Yesterday', title: 'The quilt is finished at last' },
    },
    signIn: {
      punchline: 'Bring what you made.',
      heading: 'Sign in to Ezzo',
      formLabel: 'Sign in',
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
        accountDeactivated:
          'Your account is deactivated. To come back, ask for a reactivation link by email with the link under the form.',
        accountDeleted:
          'Your account is deleted. Its data is removed for good after the retention period.',
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
      confirmPasswordLabel: 'Confirm password',
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
  // The admin panel (features/admin). Each area's name is its page title, in pages.
  admin: {
    navigationLabel: 'Admin areas',
    // The button that opens the navigation on a phone, where it is folded away.
    navigationButton: 'Admin menu',
    users: {
      title: 'Users',
      stateFilterLabel: 'Account state',
      allStates: 'All',
      // The names of the account states, by AccountState.
      states: {
        Active: 'Active',
        Deactivated: 'Deactivated',
        SoftDeleted: 'Deleted',
      },
      usernameFilterLabel: 'Username',
      searchButton: 'Search',
      createButton: 'Create account',
      columns: {
        username: 'Username',
        email: 'Email',
        role: 'Role',
        state: 'State',
        joined: 'Joined',
        deactivated: 'Deactivated',
        deleted: 'Deleted',
        actions: 'Actions',
      },
      administratorRole: 'Administrator',
      userRole: 'User',
      loading: 'Loading accounts…',
      loadingMore: 'Loading more accounts…',
      retryButton: 'Try again',
      emptyTitle: 'No accounts found',
      emptyMessage: 'No account matches these filters.',
      // The name of a row's "…" button.
      actionsLabel: (username: string) => `Actions for ${username}`,
      actions: {
        edit: 'Edit profile',
        deactivate: 'Deactivate',
        restore: 'Restore',
        delete: 'Delete',
        grantAdministrator: 'Make administrator',
        removeAdministrator: 'Remove administrator',
      },
      // What each row action asks before it runs.
      confirmations: {
        deactivate: {
          question: (username: string) => `Deactivate ${username}?`,
          detail: 'The account can not be used until you restore it or its owner reactivates it.',
          confirmButton: 'Deactivate',
        },
        restore: {
          question: (username: string) => `Restore ${username}?`,
          detail: 'The account can be used again.',
          confirmButton: 'Restore',
        },
        delete: {
          question: (username: string) => `Delete ${username}?`,
          detail: 'The account is removed from Ezzo, and its data is deleted soon after.',
          confirmButton: 'Delete',
        },
        grantAdministrator: {
          question: (username: string) => `Make ${username} an administrator?`,
          detail: 'They can manage accounts and moderate content.',
          confirmButton: 'Make administrator',
        },
        removeAdministrator: {
          question: (username: string) => `Remove ${username} as an administrator?`,
          detail: 'They lose access to the admin panel.',
          confirmButton: 'Remove',
        },
      },
      createDialog: {
        title: 'Create an account',
        submitButton: 'Create account',
        createdToast: (username: string) => `Created the account ${username}.`,
      },
      editDialog: {
        title: (username: string) => `Edit ${username}`,
        loading: 'Loading the profile…',
        retryButton: 'Try again',
        submitButton: 'Save',
        savedToast: (username: string) => `Saved the profile of ${username}.`,
      },
    },
    // A post, a comment or a user under review, as the reports and the moderation queue show them.
    snapshots: {
      // Before the title of the post a reported comment is on.
      onPost: 'On the post',
      noBio: 'No bio.',
    },
    reports: {
      title: 'Reports',
      statusTabsLabel: 'Report status',
      targetFilterLabel: 'Reported content',
      allTargets: 'All',
      // The names of the report statuses, by ReportStatus.
      statuses: {
        Pending: 'Awaiting review',
        Resolved: 'Resolved',
        Rejected: 'Rejected',
      },
      // The names of what can be reported, by ReportTargetType.
      targets: {
        Post: 'Posts',
        Comment: 'Comments',
        User: 'Users',
      },
      loading: 'Loading reports…',
      loadingMore: 'Loading more reports…',
      retryButton: 'Try again',
      end: 'That is every report.',
      emptyTitle: 'No reports found',
      emptyMessage: 'No report matches these filters.',
      card: {
        reportedBy: 'Reported by',
        reason: 'Reason',
        // The heading of the reported thing, by ReportTargetType.
        reported: {
          Post: 'Reported post',
          Comment: 'Reported comment',
          User: 'Reported user',
        },
        // The mark on a report whose target is gone, by ReportTargetType.
        targetMissing: {
          Post: 'This post no longer exists. The report can only be rejected.',
          Comment: 'This comment no longer exists. The report can only be rejected.',
          User: 'This user no longer exists. The report can only be rejected.',
        },
        // How a Resolved report was settled, by ReportTargetType: Hide is the only way to resolve one.
        resolvedBy: {
          Post: (username: string, time: string) => `Post hidden by ${username}, ${time}`,
          Comment: (username: string, time: string) => `Comment hidden by ${username}, ${time}`,
          User: (username: string, time: string) => `Account deactivated by ${username}, ${time}`,
        },
        rejectedBy: (username: string, time: string) => `Rejected by ${username}, ${time}`,
      },
      // The decision that resolves a report, by ReportTargetType: a user is deactivated, not hidden.
      hideButton: { Post: 'Hide', Comment: 'Hide', User: 'Deactivate' },
      rejectButton: 'Reject',
      // Asked before Deactivate on a reported user.
      confirmDeactivateUser: {
        question: (username: string) => `Deactivate ${username}?`,
        detail:
          'The account is deactivated and its owner is emailed. Every other pending report on this user is closed with it.',
        confirmButton: 'Deactivate',
      },
    },
    moderation: {
      title: 'Moderation queue',
      tabsLabel: 'Flagged content',
      postsTab: 'Posts',
      commentsTab: 'Comments',
      loadingPosts: 'Loading flagged posts…',
      loadingMorePosts: 'Loading more flagged posts…',
      loadingComments: 'Loading flagged comments…',
      loadingMoreComments: 'Loading more flagged comments…',
      retryButton: 'Try again',
      endPosts: 'That is every flagged post.',
      endComments: 'That is every flagged comment.',
      emptyPostsTitle: 'No flagged posts',
      emptyPostsMessage: 'Nothing is waiting for a decision.',
      emptyCommentsTitle: 'No flagged comments',
      emptyCommentsMessage: 'Nothing is waiting for a decision.',
      hideButton: 'Hide',
      makeVisibleButton: 'Make visible',
    },
    logs: {
      title: 'Audit',
      filtersLabel: 'Audit filters',
      userIdLabel: 'User id',
      actionLabel: 'Action',
      entityNameLabel: 'Entity name',
      entityIdLabel: 'Entity id',
      fromLabel: 'From',
      toLabel: 'To',
      // Under the period: the zone its times are typed in, which the page reads from the browser.
      periodHint: (timeZone: string) => `Times are in your time zone, ${timeZone}.`,
      searchButton: 'Search',
      clearButton: 'Clear filters',
      outcomeLabel: 'Outcome',
      // The choices of the outcome filter.
      outcomes: { all: 'All', succeeded: 'Succeeded', failed: 'Failed' },
      requestLabel: 'Request',
      // The choices of the authorized filter, and the words a row shows for the same fact.
      requests: { all: 'All', authorized: 'Authorized', unauthorized: 'Unauthorized' },
      columns: {
        time: 'Time',
        user: 'User',
        action: 'Action',
        entity: 'Entity',
        outcome: 'Outcome',
      },
      // The label of a row's details on a phone, where each row is a card.
      detailsLabel: 'Details',
      // A row's user: the id, as "#12".
      userId: (id: number) => `#${id}`,
      // The name and the id of the entity a row is about.
      entity: (name: string | null, id: number | null) =>
        [name, id === null ? null : `#${id}`].filter((part) => part !== null).join(' '),
      loading: 'Loading the audit…',
      loadingMore: 'Loading more rows…',
      retryButton: 'Try again',
      emptyTitle: 'No rows found',
      emptyMessage: 'No audit row matches these filters.',
    },
    statistics: {
      title: 'Statistics',
      loading: 'Loading the statistics…',
      retryButton: 'Try again',
      totalsTitle: 'Totals',
      activeAccounts: 'Active accounts',
      deactivatedAccounts: 'Deactivated accounts',
      posts: 'Posts',
      comments: 'Comments',
      messages: 'Messages',
      likes: 'Likes',
      pendingReports: 'Reports awaiting review',
      last7DaysTitle: 'Created in the last 7 days',
      last30DaysTitle: 'Created in the last 30 days',
      newAccounts: 'New accounts',
      newPosts: 'New posts',
      newComments: 'New comments',
      newMessages: 'New messages',
      onlineTitle: 'Online now',
      onlineUsers: 'Users online',
    },
  },
  users: {
    search: {
      label: 'Search users',
      submitButton: 'Search',
      resultsLabel: 'Search results',
      // Shown while the field is empty.
      promptTitle: 'Find people',
      promptMessage: 'Type a username to see who is on Ezzo.',
      loading: 'Searching…',
      loadingMore: 'Loading more users…',
      emptyTitle: 'No one found',
      emptyMessage: (words: string) => `No username matches “${words}”. Try other words.`,
      retryButton: 'Try again',
    },
    // A user's page at /users/:username (features/users/profile-page).
    profile: {
      loading: 'Loading the profile…',
      retryButton: 'Try again',
      // The birthday as a day and a month, with no year: the age stays private.
      birthday: (date: string) => `Birthday: ${date}`,
      tabsLabel: 'Profile sections',
      postsTab: 'Posts',
      friendsTab: 'Friends',
      // On the reader's own profile, where another profile shows the friendship button.
      settingsLink: 'Edit your profile',
      messageButton: 'Message',
      menuLabel: 'Actions for this profile',
      // The friendship buttons while the relationship is read, and when reading it failed.
      friendshipLoading: 'Checking your friendship…',
      posts: {
        loading: 'Loading posts…',
        loadingMore: 'Loading more posts…',
        emptyTitle: 'No posts yet',
        emptyMessage: 'Posts written by this user show up here.',
        emptyOwnMessage: 'Posts you write show up here.',
        writeButton: 'Write a post',
        retryButton: 'Try again',
      },
      friends: {
        loading: 'Loading friends…',
        loadingMore: 'Loading more friends…',
        emptyTitle: 'No friends yet',
        emptyMessage: 'Friends of this user show up here.',
        retryButton: 'Try again',
      },
    },
    // The settings page at /settings (features/users/settings-page). The profile form reuses the labels
    // and hints of registration (auth.register).
    settings: {
      heading: 'Settings',
      // The link above the page that leads back to the page the user came from.
      backLink: 'Back',
      loading: 'Loading your settings…',
      retryButton: 'Try again',
      profile: {
        heading: 'Profile',
        // Under the username: the rule, then when it was last changed, then when it can change again.
        usernameRule: (days: number) =>
          pluralize(Language.English, days, {
            one: `Your username can change once in ${days} day.`,
            other: `Your username can change once in ${days} days.`,
          }),
        usernameNeverChanged: 'You have not changed it yet.',
        usernameLastChanged: (date: string) => `You last changed it on ${date}.`,
        usernameChangeableFrom: (date: string) => `You can change it again on ${date}.`,
        usernameChangeableNow: 'You can change it now.',
        created: (date: string) => `Your account was created on ${date}.`,
        submitButton: 'Save changes',
        savedToast: 'Your profile is saved.',
      },
      language: {
        heading: 'Language',
        description: 'Choose the language of the interface.',
      },
      password: {
        heading: 'Password',
        description: 'We email you a link to choose a new password.',
        requestButton: 'Email me a reset link',
        sent: (email: string) =>
          `The email is on its way to ${email}. Open its link to choose a new password.`,
      },
      dangerZone: {
        heading: 'Danger zone',
        deactivate: {
          heading: 'Deactivate your account',
          description:
            'You are signed out and your account is hidden. You can reactivate it any time with a link we email you.',
          button: 'Deactivate account',
          question: 'Deactivate your account?',
          detail: 'You are signed out at once. A link by email brings the account back.',
          confirmButton: 'Deactivate',
        },
        delete: {
          heading: 'Delete your account',
          description:
            'You are signed out and your account is deleted. Its data is removed for good after the retention period.',
          button: 'Delete account',
          question: 'Delete your account?',
          detail: 'You are signed out at once, and the account cannot be brought back.',
          // The sentence to type to confirm, with the username as it is now.
          typedSentence: (username: string) => `I am ${username} and I want to delete my account`,
          confirmButton: 'Delete',
        },
      },
    },
  },
  // The friendship buttons on a profile and what they ask (features/friendships).
  friendships: {
    // One button each, by the action's name (FriendshipAction).
    actions: {
      Add: 'Add friend',
      Cancel: 'Cancel request',
      Accept: 'Accept',
      Decline: 'Decline',
      Remove: 'Remove friend',
    },
    removeConfirmation: {
      question: (username: string) => `Remove ${username} from your friends?`,
      detail: 'The messages between you are deleted with the friendship. This cannot be undone.',
      confirmButton: 'Remove',
    },
    // The friends page at /friends (features/friendships/friends-page).
    page: {
      heading: 'Friends',
      tabsLabel: 'Friend lists',
      myFriendsTab: 'My friends',
      findFriendsButton: 'Find friends',
      incomingTab: 'Requests',
      sentTab: 'Sent',
      retryButton: 'Try again',
      // The link on each of My friends' rows that opens the conversation.
      messageButton: 'Message',
      // Remove's short label on a row, so that it fits beside Message on a phone; screen readers still
      // hear the full "Remove friend: name".
      removeButton: 'Remove',
      // A row's button as screen readers hear it, since "Accept" alone does not say for whom.
      rowActionLabel: (action: string, username: string) => `${action}: ${username}`,
      // One group per list, by the tab's name (FriendsTab).
      lists: {
        friends: {
          loading: 'Loading your friends…',
          loadingMore: 'Loading more friends…',
          emptyTitle: 'No friends yet',
          emptyMessage: 'Search for people you know and send them a request.',
        },
        incoming: {
          loading: 'Loading requests…',
          loadingMore: 'Loading more requests…',
          emptyTitle: 'No requests waiting',
          emptyMessage: 'When someone asks to be your friend, the request shows up here.',
        },
        sent: {
          loading: 'Loading sent requests…',
          loadingMore: 'Loading more requests…',
          emptyTitle: 'No requests sent',
          emptyMessage: 'Requests you send wait here until the other person answers.',
        },
      },
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
      // Under a long post in a list: it opens the rest of the text in place.
      seeMore: 'See more',
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
      // The feed's heading, a short invitation in the product's voice (PRODUCT.md). The browser tab keeps the page's plain name (pages.feed).
      heading: "What we've brought lately",
      writeButton: 'Write a post',
      loading: 'Loading posts…',
      loadingMore: 'Loading more posts…',
      emptyTitle: 'Nothing here yet',
      emptyMessage: 'When other people write posts, they show up here.',
      retryButton: 'Try again',
      end: 'You have reached the end of the feed.',
    },
    // A post's own page (/posts/:postId, features/posts/post-page).
    page: {
      // The Back link above a post and above the composer (shared/back-link).
      backLink: 'Back',
      loading: 'Loading the post…',
      retryButton: 'Try again',
    },
    // The "…" menu on a post card. Its entries are shared.content's.
    menu: {
      label: 'Actions for this post',
    },
    // The page where a post's author edits it (/posts/:postId/edit, features/posts/edit-post-page).
    edit: {
      loading: 'Loading the post…',
      retryButton: 'Try again',
      titleLabel: 'Title',
      contentLabel: 'Text',
      photosLabel: 'Photos',
      photosHint: 'Photos cannot be changed yet.',
      saveButton: 'Save',
      cancelButton: 'Cancel',
      // Replaces the uploading toast (posts.composer.uploadingToast) once the server has the edit.
      savedToast: 'Your post is saved.',
    },
    deleteConfirmation: {
      question: 'Delete this post?',
      detail: 'Its photos and comments are deleted with it. This cannot be undone.',
      confirmButton: 'Delete',
    },
    // After the server has deleted a post, the author's or, for an administrator, anyone's.
    deletedToast: 'The post is deleted.',
  },
  // A post's comments and the form under them (features/comments).
  comments: {
    heading: 'Comments',
    loading: 'Loading comments…',
    loadingMore: 'Loading more comments…',
    retryButton: 'Try again',
    emptyMessage: 'No comments yet. Be the first to write one.',
    // Under a comment that is on its way to the server, a new one or an edit.
    sending: 'Sending…',
    // The form under the comments, for a signed-in user.
    form: {
      label: 'Write a comment',
      contentLabel: 'Your comment',
      submitButton: 'Comment',
    },
    // In place of the form for a guest.
    guest: {
      message: 'Sign in to write a comment.',
      signInLink: 'Sign in',
    },
    // The form that opens in place of a comment's text when its author edits it.
    edit: {
      label: 'Edit your comment',
      contentLabel: 'Your comment',
      saveButton: 'Save',
      cancelButton: 'Cancel',
    },
    // The "…" menu on a comment. Its entries are shared.content's.
    menu: {
      label: 'Actions for this comment',
    },
    deleteConfirmation: {
      question: 'Delete this comment?',
      detail: 'This cannot be undone.',
      confirmButton: 'Delete',
    },
    // After the server has deleted a comment.
    deletedToast: 'The comment is deleted.',
  },
  // Reporting a post or a comment to the administrators (features/reports).
  reports: {
    dialog: {
      postTitle: 'Report this post',
      commentTitle: 'Report this comment',
      userTitle: 'Report this user',
      reasonLabel: 'Reason',
      reasonHint: 'Tell the administrators what is wrong with it.',
      submitButton: 'Send report',
    },
    sentToast: 'Thank you. Your report was sent.',
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
      notFoundMessage: (username: string) => `Nobody on Ezzo is called ${username}.`,
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
      // The accessible label of the clock that stands where the time of a message on its way goes.
      sending: 'Sending',
      // Under the user's last message that the friend has read.
      seen: 'Seen',
      // Under the friend's name, in place of their presence, while they are writing.
      typing: 'typing…',
    },
    // The "…" menu at the end of the user's own message.
    menu: {
      label: 'Actions for this message',
      editEntry: 'Edit',
      deleteEntry: 'Delete',
    },
    // The message box while it holds an edit: its label and its two buttons.
    edit: {
      label: 'Edit your message',
      saveButton: 'Save',
      cancelButton: 'Cancel editing',
    },
    deleteConfirmation: {
      question: 'Delete this message?',
      detail: 'It is deleted for you and for your friend, with its photos. This cannot be undone.',
      confirmButton: 'Delete',
    },
    // After the server has deleted a message.
    deletedToast: 'The message is deleted.',
    // The box under the open conversation where the user writes.
    messageBox: {
      label: 'Write a message',
      contentLabel: 'Message',
      placeholder: 'Write a message…',
      sendButton: 'Send',
    },
    // The button above the list, and its dialog of friends without a conversation.
    newMessage: {
      openButton: 'New message',
      title: 'New message',
      loading: 'Loading your friends…',
      loadingMore: 'Loading more friends…',
      retryButton: 'Try again',
      emptyTitle: 'Nobody left to start with',
      emptyMessage:
        'You already have a conversation with every friend. Add friends to write to someone new.',
      listLabel: 'Friends you have not written to yet',
    },
  },
};
