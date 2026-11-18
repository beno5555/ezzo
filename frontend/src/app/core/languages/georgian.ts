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
  },
  auth: {
    signIn: {
      title: 'შესვლა',
      identifierLabel: 'მომხმარებლის სახელი ან ელფოსტა',
      passwordLabel: 'პაროლი',
      submitButton: 'შესვლა',
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
};
