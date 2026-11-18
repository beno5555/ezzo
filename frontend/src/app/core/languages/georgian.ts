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
  session: {
    signedInAs: (username: string) => `შესული ხართ, როგორც ${username}`,
    signOutButton: 'გასვლა',
    signInLink: 'შესვლა',
  },
  live: {
    label: 'მიმდინარე მდგომარეობა',
    // A Georgian noun stays singular after a number, so `other` covers every count.
    unreadConversations: (count: number) =>
      pluralize(Language.Georgian, count, {
        other: `${count} საუბარი წაუკითხავი შეტყობინებებით`,
      }),
    onlineFriends: 'ონლაინ მეგობრები:',
    noFriendsOnline: 'ონლაინ მეგობარი არავინაა',
  },
  buttonSamples: {
    label: 'ღილაკების ნიმუშები',
    primary: 'მთავარი',
    quiet: 'მშვიდი',
    danger: 'საშიში',
    disabled: 'გამორთული',
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
  blockSamples: {
    label: 'საშენი ბლოკების ნიმუშები',
    toastButton: 'შეტყობინების ჩვენება',
    toastMessage: 'პოსტის მოწონება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.',
    linkToastButton: 'ბმულიანი შეტყობინების ჩვენება',
    linkToastMessage: 'alice_smith-მა შეტყობინება გამოგიგზავნათ',
    fourToastsButton: 'ოთხი შეტყობინების ჩვენება',
    numberedToastMessage: (number: number) => `შეტყობინება ნომერი ${number}`,
    dialogButton: 'ფანჯრის გახსნა',
    dialogTitle: 'ფანჯარა',
    dialogMessage:
      'კლავიატურის ფოკუსი ამ ფანჯრის შიგნით რჩება. მას ხურავს Escape, დაწკაპუნება გარეთ ან დახურვის ღილაკი.',
    dialogInputLabel: 'რაიმე ჩასაწერი',
    confirmationButton: 'დადასტურების მოთხოვნა',
    confirmationQuestion: 'წავშალოთ ეს პოსტი?',
    confirmationDetail: 'პოსტი და მისი კომენტარები სამუდამოდ წაიშლება.',
    confirmationConfirm: 'წაშლა',
    typedConfirmationButton: 'ჩაწერით დადასტურების მოთხოვნა',
    typedConfirmationQuestion: 'წავშალოთ თქვენი ანგარიში?',
    typedConfirmationDetail: 'თქვენი ანგარიში წაიშლება და სისტემიდან გახვალთ.',
    typedConfirmationConfirm: 'ჩემი ანგარიშის წაშლა',
    answeredYes: 'თქვენ უპასუხეთ „დიახ“.',
    answeredNo: 'თქვენ უპასუხეთ „არა“.',
    menuLabel: 'ნიმუშის პოსტის მოქმედებები',
    menuReport: 'დასაჩივრება',
    menuEdit: 'რედაქტირება',
    menuDelete: 'წაშლა',
    chosen: (entry: string) => `თქვენ აირჩიეთ: ${entry}.`,
    avatarsLabel: 'პროფილის სურათები',
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
