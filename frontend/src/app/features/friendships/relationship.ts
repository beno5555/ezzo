import { StandardFriendshipDto } from './standard-friendship-dto';

// Where the signed-in user stands with another person, as far as the friendship buttons care: the status
// and who sent the request. No relationship at all is null.
export type Relationship = Pick<StandardFriendshipDto, 'status' | 'isRequester'>;
