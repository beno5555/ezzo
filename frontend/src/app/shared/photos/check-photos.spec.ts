import { checkPhotos } from './check-photos';
import { PhotoRefusalReason } from './photo-refusal-reason';
import { PhotoRules } from './photo-rules';

const megabyte = 1024 * 1024;

const postRules: PhotoRules = {
  maxCount: 10,
  maxFileSizeBytes: 5 * megabyte,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

const photo = (name: string, type = 'image/jpeg', size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe('checkPhotos', () => {
  it.each([
    ['lake.jpg', 'image/jpeg'],
    ['map.png', 'image/png'],
    ['sky.webp', 'image/webp'],
  ])('accepts %s, a %s photo', (name, type) => {
    const picked = photo(name, type);

    expect(checkPhotos([picked], 0, postRules)).toEqual({ accepted: [picked], refusals: [] });
  });

  it('refuses a file of another type and names it', () => {
    const gif = photo('dance.gif', 'image/gif');
    const pdf = photo('notes.pdf', 'application/pdf');

    expect(checkPhotos([gif, pdf], 0, postRules)).toEqual({
      accepted: [],
      refusals: [
        { fileName: 'dance.gif', reason: PhotoRefusalReason.WrongType },
        { fileName: 'notes.pdf', reason: PhotoRefusalReason.WrongType },
      ],
    });
  });

  it('accepts a photo of exactly 5 MB and refuses one a byte larger', () => {
    const atLimit = photo('at-limit.jpg', 'image/jpeg', 5 * megabyte);
    const overLimit = photo('over-limit.jpg', 'image/jpeg', 5 * megabyte + 1);

    expect(checkPhotos([atLimit, overLimit], 0, postRules)).toEqual({
      accepted: [atLimit],
      refusals: [{ fileName: 'over-limit.jpg', reason: PhotoRefusalReason.TooLarge }],
    });
  });

  it('refuses the eleventh photo of a post, counting the photos already chosen', () => {
    const tenth = photo('tenth.jpg');
    const eleventh = photo('eleventh.jpg');

    expect(checkPhotos([tenth, eleventh], 9, postRules)).toEqual({
      accepted: [tenth],
      refusals: [{ fileName: 'eleventh.jpg', reason: PhotoRefusalReason.TooMany }],
    });
  });

  it('keeps a place for a good photo that follows a refused one, in the order they were picked', () => {
    const first = photo('first.jpg');
    const gif = photo('dance.gif', 'image/gif');
    const second = photo('second.png', 'image/png');

    expect(checkPhotos([first, gif, second], 8, postRules)).toEqual({
      accepted: [first, second],
      refusals: [{ fileName: 'dance.gif', reason: PhotoRefusalReason.WrongType }],
    });
  });

  it('takes its count from the rules, so a message stops at five', () => {
    const messageRules: PhotoRules = { ...postRules, maxCount: 5 };
    const sixth = photo('sixth.jpg');

    expect(checkPhotos([sixth], 5, messageRules)).toEqual({
      accepted: [],
      refusals: [{ fileName: 'sixth.jpg', reason: PhotoRefusalReason.TooMany }],
    });
  });
});
