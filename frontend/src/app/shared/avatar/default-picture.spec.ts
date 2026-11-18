import { defaultPicture } from './default-picture';

describe('defaultPicture', () => {
  describe('initials', () => {
    it('are the first letter of each part of a username in two parts', () => {
      expect(defaultPicture(1, 'john_doe', false).initials).toBe('JD');
      expect(defaultPicture(1, 'mary-jane', false).initials).toBe('MJ');
      expect(defaultPicture(1, 'john.doe', false).initials).toBe('JD');
    });

    it('are the first two letters of any other username', () => {
      expect(defaultPicture(1, 'alice', false).initials).toBe('AL');
      expect(defaultPicture(1, 'anna_bella_cruz', false).initials).toBe('AN');
      expect(defaultPicture(1, 'x99', false).initials).toBe('X9');
    });

    it('skip a separator at the start, at the end or doubled', () => {
      expect(defaultPicture(1, '_alice', false).initials).toBe('AL');
      expect(defaultPicture(1, 'alice-', false).initials).toBe('AL');
      expect(defaultPicture(1, 'john__doe', false).initials).toBe('JD');
    });
  });

  describe('disc', () => {
    it('is chosen by the id, so it survives a change of username', () => {
      expect(defaultPicture(3, 'alice', false).discClass).toBe('bg-disc-4');
      expect(defaultPicture(3, 'alice_renamed', false).discClass).toBe('bg-disc-4');
    });

    it('cycles through the eight disc colours', () => {
      const discs = [8, 1, 2, 3, 4, 5, 6, 7, 16].map(
        (userId) => defaultPicture(userId, 'alice', false).discClass,
      );

      expect(discs).toEqual([
        'bg-disc-1',
        'bg-disc-2',
        'bg-disc-3',
        'bg-disc-4',
        'bg-disc-5',
        'bg-disc-6',
        'bg-disc-7',
        'bg-disc-8',
        'bg-disc-1',
      ]);
    });
  });

  it('is the grey disc with no letters for an account that is deactivated or deleted', () => {
    expect(defaultPicture(3, 'alice', true)).toEqual({
      initials: '',
      discClass: 'bg-disc-unavailable',
    });
  });
});
