import { ButtonLook } from '../../shared/button/button-look';
import { FriendshipAction } from './friendship-action';

// Which look each friendship button takes, on a profile and on the friends page: Add and Accept are the
// primary action, Remove is in danger, the rest are quiet.
export const friendshipActionLooks: Record<FriendshipAction, ButtonLook> = {
  [FriendshipAction.Add]: ButtonLook.Primary,
  [FriendshipAction.Accept]: ButtonLook.Primary,
  [FriendshipAction.Cancel]: ButtonLook.Quiet,
  [FriendshipAction.Decline]: ButtonLook.Quiet,
  [FriendshipAction.Remove]: ButtonLook.Danger,
};
