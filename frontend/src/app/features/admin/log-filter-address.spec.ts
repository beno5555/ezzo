import { convertToParamMap } from '@angular/router';
import { logFilterFromParams, logFilterToParams } from './log-filter-address';
import { LogFilter } from './log-filter';

const fullFilter: LogFilter = {
  userId: 3,
  authorizedRequest: true,
  succeeded: false,
  action: 'PostService',
  entityName: 'Post',
  entityId: 8,
  from: '2026-11-19T22:00:00.000Z',
  to: '2026-11-20T21:59:59.999Z',
};

describe('the logs filter in the address', () => {
  it('reads back what it wrote, every filter at once', () => {
    const params = logFilterToParams(fullFilter);

    expect(logFilterFromParams(convertToParamMap(params))).toEqual(fullFilter);
  });

  it('writes a false flag, which is a filter, and leaves out what is not set', () => {
    expect(logFilterToParams({ succeeded: false, action: '', userId: undefined })).toEqual({
      succeeded: 'false',
    });
  });

  it('reads an empty address as no filter', () => {
    expect(logFilterFromParams(convertToParamMap({}))).toEqual({});
  });

  it('reads a time with an offset as the same moment in UTC', () => {
    const params = convertToParamMap({ from: '2026-11-20T10:00:00+04:00' });

    expect(logFilterFromParams(params)).toEqual({ from: '2026-11-20T06:00:00.000Z' });
  });

  it('reads a time that does not say its offset as not set', () => {
    const params = convertToParamMap({ from: '2026-11-20T10:00', to: '1' });

    expect(logFilterFromParams(params)).toEqual({});
  });

  it('reads a value that does not fit its name as not set', () => {
    const params = convertToParamMap({
      userId: 'abc',
      entityId: '-4',
      succeeded: 'maybe',
      authorizedRequest: '1',
      action: '   ',
      from: 'yesterday',
      to: '',
    });

    expect(logFilterFromParams(params)).toEqual({});
  });
});
