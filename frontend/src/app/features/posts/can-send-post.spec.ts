import { canSendPost } from './can-send-post';

const photo = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });

describe('canSendPost', () => {
  it.each([
    ['a title and text', { title: 'Sunday', content: 'Cold water.', photos: [] }],
    ['a title and a photo', { title: 'Sunday', content: '', photos: [photo] }],
    ['a title, text and a photo', { title: 'Sunday', content: 'Cold water.', photos: [photo] }],
  ])('lets %s be sent', (_, draft) => {
    expect(canSendPost(draft)).toBe(true);
  });

  it.each([
    ['a title alone', { title: 'Sunday', content: '', photos: [] }],
    ['a title with only spaces for text', { title: 'Sunday', content: '   \n ', photos: [] }],
    ['text and a photo without a title', { title: '', content: 'Cold water.', photos: [photo] }],
    ['a title of only spaces', { title: '   ', content: 'Cold water.', photos: [] }],
    ['a title over 100 characters', { title: 'a'.repeat(101), content: 'Cold water.', photos: [] }],
    ['text over 3000 characters', { title: 'Sunday', content: 'a'.repeat(3001), photos: [] }],
  ])('does not let %s be sent', (_, draft) => {
    expect(canSendPost(draft)).toBe(false);
  });

  it('lets a title of exactly 100 characters and text of exactly 3000 be sent', () => {
    expect(canSendPost({ title: 'a'.repeat(100), content: 'a'.repeat(3000), photos: [] })).toBe(
      true,
    );
  });
});
