import { ringClass } from './default-picture';

describe('ringClass', () => {
  it('follows the id, so it survives a change of username', () => {
    expect(ringClass(3, false)).toBe('border-disc-4');
  });

  it('cycles through the eight disc colours', () => {
    const rings = [8, 1, 2, 3, 4, 5, 6, 7, 16].map((userId) => ringClass(userId, false));

    expect(rings).toEqual([
      'border-disc-1',
      'border-disc-2',
      'border-disc-3',
      'border-disc-4',
      'border-disc-5',
      'border-disc-6',
      'border-disc-7',
      'border-disc-8',
      'border-disc-1',
    ]);
  });

  it('is grey for an account that is deactivated or deleted', () => {
    expect(ringClass(3, true)).toBe('border-disc-unavailable');
  });
});
