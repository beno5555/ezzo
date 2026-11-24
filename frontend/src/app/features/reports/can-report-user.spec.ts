import { canReportUser } from './can-report-user';

describe('canReportUser', () => {
  it('offers Report to a signed-in user on another profile', () => {
    expect(canReportUser(2, 5)).toBe(true);
  });

  it('offers nothing on the user own profile', () => {
    expect(canReportUser(5, 5)).toBe(false);
  });

  it('offers nothing to a guest', () => {
    expect(canReportUser(null, 5)).toBe(false);
  });
});
