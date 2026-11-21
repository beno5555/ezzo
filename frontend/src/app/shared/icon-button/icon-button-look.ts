// The two looks of an IconButton: plain, for a button on a surface, and on a photo, where a full
// 44 px square would hide too much of the picture.
export const IconButtonLook = { Plain: 'plain', OnPhoto: 'on-photo' } as const;
export type IconButtonLook = (typeof IconButtonLook)[keyof typeof IconButtonLook];
