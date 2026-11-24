import { ringClass } from './default-picture';

describe('ringClass', () => {
  it('follows the id, so it survives a change of username', () => {
    expect(ringClass(3, false)).toBe('border-avatar-4');
  });

  it('cycles through the eight ring colours', () => {
    const rings = [8, 1, 2, 3, 4, 5, 6, 7, 16].map((userId) => ringClass(userId, false));

    expect(rings).toEqual([
      'border-avatar-1',
      'border-avatar-2',
      'border-avatar-3',
      'border-avatar-4',
      'border-avatar-5',
      'border-avatar-6',
      'border-avatar-7',
      'border-avatar-8',
      'border-avatar-1',
    ]);
  });

  it('is grey for an account that is deactivated or deleted', () => {
    expect(ringClass(3, true)).toBe('border-avatar-unavailable');
  });
});
