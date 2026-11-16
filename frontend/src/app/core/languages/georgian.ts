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
