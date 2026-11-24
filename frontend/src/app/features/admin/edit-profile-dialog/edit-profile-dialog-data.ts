import { AdminUserDto } from '../admin-user-dto';

// What the page gives the edit dialog: the account whose profile is edited.
export type EditProfileDialogData = {
  account: AdminUserDto;
};
