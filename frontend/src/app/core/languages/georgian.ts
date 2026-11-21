import { Dictionary } from './dictionary';
import { Language } from './language';
import { pluralize } from './pluralize';

export const georgian: Dictionary = {
  app: {
    name: 'WebCity',
  },
  languages: {
    ownName: 'ქართული',
    switchLabel: 'ენა',
  },
  themes: {
    switchLabel: 'თემა',
    light: 'ღია',
    dark: 'მუქი',
  },
  httpFailures: {
    validation: 'ზოგიერთი ველი არასწორადაა შევსებული.',
    unauthorized: 'გასაგრძელებლად გთხოვთ, შეხვიდეთ სისტემაში.',
    forbidden: 'ამის გაკეთების უფლება არ გაქვთ.',
    notFound: 'ეს ვერ მოიძებნა.',
    network: 'WebCity-სთან დაკავშირება ვერ მოხერხდა. შეამოწმეთ კავშირი და სცადეთ თავიდან.',
    unexpected: 'რაღაც შეცდომა მოხდა. გთხოვთ, სცადოთ თავიდან.',
  },
  notFound: {
    title: 'გვერდი ვერ მოიძებნა',
    message: 'ამ მისამართზე არაფერია.',
    homeLink: 'მთავარ გვერდზე დაბრუნება',
  },
  pages: {
    home: 'მთავარი',
    feed: 'სიახლეები',
    signIn: 'შესვლა',
    register: 'რეგისტრაცია',
    forgotPassword: 'პაროლის აღდგენა',
    resetPassword: 'ახალი პაროლის არჩევა',
    reactivateAccount: 'ანგარიშის ხელახლა გააქტიურება',
    post: 'პოსტი',
    profile: 'პროფილი',
    search: 'ძებნა',
    settings: 'პარამეტრები',
    friends: 'მეგობრები',
    messages: 'შეტყობინებები',
    conversation: 'საუბარი',
    adminUsers: 'მომხმარებლები',
    adminReports: 'საჩივრები',
    adminModeration: 'მოდერაციის რიგი',
    adminLogs: 'ჟურნალი',
    adminStatistics: 'სტატისტიკა',
    notFound: 'გვერდი ვერ მოიძებნა',
  },
  pagePlaceholder: {
    message: 'ეს გვერდი ჯერ არ არის მზად.',
  },
  shell: {
    navigationLabel: 'მთავარი',
    feedLink: 'სიახლეები',
    friendsLink: 'მეგობრები',
    messagesLink: 'შეტყობინებები',
    bottomBar: {
      feedLink: 'ფიდი',
      searchLink: 'ძებნა',
      friendsLink: 'მეგობრები',
      messagesLink: 'ჩატი',
      profileLink: 'პროფილი',
    },
    searchLabel: 'მომხმარებლების ძებნა',
    searchButton: 'ძებნა',
    userMenuLabel: 'თქვენი მენიუ',
    preferencesMenuLabel: 'ენა და თემა',
    signedInAs: 'შესული ხართ, როგორც',
    myProfileLink: 'ჩემი პროფილი',
    settingsLink: 'პარამეტრები',
    adminLink: 'ადმინისტრირება',
    signOutButton: 'გასვლა',
    signInLink: 'შესვლა',
    registerLink: 'რეგისტრაცია',
    unreadBadge: (badge: string) => `${badge} წაუკითხავი`,
    waitingBadge: (badge: string) => `${badge} მოლოდინში`,
  },
  shared: {
    dialog: {
      closeButton: 'დახურვა',
    },
    confirmation: {
      cancelButton: 'გაუქმება',
      typedWordPrompt: 'დასადასტურებლად ჩაწერეთ',
    },
    menu: {
      buttonLabel: 'სხვა მოქმედებები',
    },
    toasts: {
      regionLabel: 'შეტყობინებები',
    },
    photos: {
      openButton: (position: number, total: number) => `ფოტო ${position} / ${total}-ის გახსნა`,
      openMoreButton: (position: number, total: number, count: number) =>
        pluralize(Language.Georgian, count, {
          other: `ფოტო ${position} / ${total}-ის გახსნა, კიდევ ${count} ფოტო`,
        }),
      moreBadge: (count: number) => `+${count}`,
      viewerLabel: 'ფოტოები',
      photoDescription: (position: number, total: number) => `ფოტო ${position} / ${total}`,
      position: (position: number, total: number) => `${position} / ${total}`,
      previousButton: 'წინა ფოტო',
      nextButton: 'შემდეგი ფოტო',
      addButton: 'ფოტოების დამატება',
      removeButton: (position: number, total: number) => `ფოტო ${position} / ${total}-ის ამოღება`,
      count: (count: number, max: number) => `${count} / ${max} ფოტო`,
      refusals: {
        tooMany: (fileName: string, max: number) =>
          `${fileName} არ დაემატა: შეგიძლიათ დაამატოთ მაქსიმუმ ${max} ფოტო.`,
        wrongType: (fileName: string) =>
          `${fileName} არ დაემატა: დაიშვება მხოლოდ JPEG, PNG და WebP ფოტოები.`,
        tooLarge: (fileName: string, maxMegabytes: number) =>
          `${fileName} არ დაემატა: ფოტოს ზომა მაქსიმუმ ${maxMegabytes} მბ უნდა იყოს.`,
      },
    },
    formField: {
      errors: {
        required: 'შეავსეთ ეს ველი.',
        minLength: (length: number) =>
          pluralize(Language.Georgian, length, {
            other: `გამოიყენეთ მინიმუმ ${length} სიმბოლო.`,
          }),
        maxLength: (length: number) =>
          pluralize(Language.Georgian, length, {
            other: `გამოიყენეთ მაქსიმუმ ${length} სიმბოლო.`,
          }),
        usernameCharacters: 'გამოიყენეთ ლათინური ასოები, ციფრები, _ და -, მინიმუმ ერთი ასოთი.',
        emailFormat: 'შეიყვანეთ ელფოსტის მისამართი, მაგალითად name@example.com.',
        futureDate: 'დაბადების თარიღი მომავალში ვერ იქნება.',
        tooYoung: (minAge: number) =>
          pluralize(Language.Georgian, minAge, { other: `მინიმუმ ${minAge} წლის უნდა იყოთ.` }),
        tooOld: (maxAge: number) =>
          pluralize(Language.Georgian, maxAge, {
            other: `ასაკი არ უნდა აღემატებოდეს ${maxAge} წელს.`,
          }),
        invalid: 'მნიშვნელობა არასწორია.',
      },
    },
  },
  auth: {
    linksLabel: 'ანგარიშის სხვა გვერდები',
    signIn: {
      title: 'შესვლა',
      lead: 'კეთილი იყოს თქვენი დაბრუნება.',
      identifierLabel: 'მომხმარებლის სახელი ან ელფოსტა',
      passwordLabel: 'პაროლი',
      forgotPasswordLink: 'დაგავიწყდათ პაროლი?',
      submitButton: 'შესვლა',
      registerPrompt: 'ახალი ხართ?',
      registerLink: 'შექმენით ანგარიში',
      reactivatePrompt: 'ანგარიში დეაქტივირებული გაქვთ?',
      reactivateLink: 'აღადგინეთ',
      notices: {
        accountCreated: 'ანგარიში შეიქმნა. გასაგრძელებლად შედით.',
        accountReactivated: 'თქვენი ანგარიში ისევ აქტიურია. გასაგრძელებლად შედით.',
        passwordReset: 'პაროლი შეიცვალა. შედით ახალი პაროლით.',
      },
    },
    signInLink: 'შესვლა',
    passwordHint: (min: number) =>
      pluralize(Language.Georgian, min, { other: `მინიმუმ ${min} სიმბოლო.` }),
    register: {
      title: 'ანგარიშის შექმნა',
      lead: 'ამას ერთი წუთი სჭირდება.',
      usernameLabel: 'მომხმარებლის სახელი',
      usernameHint: (min: number, max: number) =>
        `${min}–${max} სიმბოლო: ლათინური ასოები, ციფრები, _ და -.`,
      emailLabel: 'ელფოსტა',
      passwordLabel: 'პაროლი',
      dateOfBirthLabel: 'დაბადების თარიღი',
      bioLabel: 'ბიოგრაფია (არასავალდებულო)',
      bioHint: (max: number) =>
        pluralize(Language.Georgian, max, {
          other: `რამდენიმე სიტყვა თქვენ შესახებ, მაქსიმუმ ${max} სიმბოლო.`,
        }),
      submitButton: 'ანგარიშის შექმნა',
      signInPrompt: 'უკვე გაქვთ ანგარიში?',
    },
    forgotPassword: {
      title: 'დაგავიწყდათ პაროლი?',
      lead: 'შეიყვანეთ ანგარიშის ელფოსტა და გამოგიგზავნით ბმულს ახალი პაროლის ასარჩევად.',
      emailLabel: 'ელფოსტა',
      submitButton: 'ბმულის გაგზავნა',
      sent: (email: string) =>
        `ბმული გავგზავნეთ მისამართზე ${email}. გახსენით და აირჩიეთ ახალი პაროლი.`,
      signInPrompt: 'გაიხსენეთ?',
    },
    resetPassword: {
      title: 'ახალი პაროლის არჩევა',
      lead: 'ახალი პაროლი ძველს მაშინვე ჩაანაცვლებს.',
      passwordLabel: 'ახალი პაროლი',
      submitButton: 'პაროლის შეცვლა',
      missingToken: 'ეს ბმული არასრულია. ქვემოთ მოითხოვეთ ახალი.',
      newLinkPrompt: 'ბმული აღარ მუშაობს?',
      newLinkLink: 'მოითხოვეთ ახალი',
      signInPrompt: 'გაიხსენეთ?',
    },
    reactivate: {
      title: 'ანგარიშის ხელახლა გააქტიურება',
      lead: 'ელფოსტაზე გამოგიგზავნით ბმულს, რომელიც ანგარიშს ისევ ჩართავს.',
      emailLabel: 'ელფოსტა',
      requestButton: 'ბმულის გაგზავნა',
      sent: (email: string) =>
        `ბმული გავგზავნეთ მისამართზე ${email}. გახსენით ანგარიშის ისევ გასააქტიურებლად.`,
      linkLead: 'ანგარიშის ისევ ჩასართავად დააჭირეთ ღილაკს.',
      activateButton: 'ჩემი ანგარიშის გააქტიურება',
      newLinkPrompt: 'ბმული აღარ მუშაობს?',
      newLinkLink: 'მოითხოვეთ ახალი',
      signInPrompt: 'ანგარიში ისევ აქტიურია?',
    },
  },
  admin: {
    users: {
      title: 'მომხმარებლები',
    },
  },
  users: {
    search: {
      label: 'მომხმარებლების ძებნა',
      submitButton: 'ძებნა',
      // A Georgian noun stays singular after a number, so `other` covers every count.
      shown: (count: number) =>
        pluralize(Language.Georgian, count, {
          other: `ნაჩვენებია ${count} მომხმარებელი`,
        }),
    },
  },
  posts: {
    card: {
      likeButton: (count: number) =>
        pluralize(Language.Georgian, count, {
          other: `მოწონება, ${count} მოწონება`,
        }),
      commentsLink: (count: number) =>
        pluralize(Language.Georgian, count, {
          other: `${count} კომენტარი`,
        }),
      uploading: 'იტვირთება…',
    },
    composer: {
      label: 'პოსტის დაწერა',
      titleLabel: 'სათაური',
      contentLabel: 'ტექსტი',
      contentHint: 'პოსტს სჭირდება ტექსტი, ფოტოები ან ორივე.',
      submitButton: 'გამოქვეყნება',
      uploadingToast: 'თქვენი პოსტი იტვირთება…',
      publishedToast: 'თქვენი პოსტი გამოქვეყნდა.',
    },
    feed: {
      loading: 'პოსტები იტვირთება…',
      loadingMore: 'კიდევ პოსტები იტვირთება…',
      emptyTitle: 'აქ ჯერ არაფერია',
      emptyMessage: 'როცა სხვები პოსტებს დაწერენ, ისინი აქ გამოჩნდება.',
      retryButton: 'თავიდან ცდა',
      end: 'სიახლეების ბოლოს მიაღწიეთ.',
    },
  },
};
