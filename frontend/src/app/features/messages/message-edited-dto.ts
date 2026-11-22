// The hub's MessageEdited: the friend changed the text of one of their messages. It carries no photos,
// because the photos of a sent message cannot be changed.
export type MessageEditedDto = {
  id: number;
  content: string;
};
