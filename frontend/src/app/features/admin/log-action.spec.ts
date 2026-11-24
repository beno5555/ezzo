import { splitLogAction } from './log-action';

describe('splitLogAction', () => {
  it('splits the service from the method at the last dot', () => {
    expect(splitLogAction('FriendshipService.SendRequestAsync')).toEqual({
      service: 'FriendshipService',
      method: 'SendRequestAsync',
    });
  });

  it('keeps an action without a dot whole', () => {
    expect(splitLogAction('Startup')).toEqual({ service: null, method: 'Startup' });
  });

  it('keeps an action whole when the dot is its first or last character', () => {
    expect(splitLogAction('.Run')).toEqual({ service: null, method: '.Run' });
    expect(splitLogAction('Service.')).toEqual({ service: null, method: 'Service.' });
  });
});
