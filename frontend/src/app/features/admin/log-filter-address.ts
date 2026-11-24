import { ParamMap } from '@angular/router';
import { LogFilter } from './log-filter';

// The logs page keeps its filter in the address (/admin/logs?succeeded=false&action=Post…), so a filtered
// view can be reloaded and sent as a link. The names are the backend's own (LogQueryDto), and the period
// is in UTC, so the link shows the same rows in every time zone.
const numberParameters = ['userId', 'entityId'] as const;
const flagParameters = ['authorizedRequest', 'succeeded'] as const;
const textParameters = ['action', 'entityName'] as const;
const timeParameters = ['from', 'to'] as const;
// A date and a clock time that say their offset (Z or +04:00). One without it would be read in the
// reader's own zone here, and as UTC by the backend.
const utcTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// The filter an address holds. A value that is not what its name needs (a user id that is not a whole
// number, a flag that is neither true nor false, a time that is not a UTC time) is read as not set. A time
// is kept as its UTC form.
export function logFilterFromParams(params: ParamMap): LogFilter {
  const filter: LogFilter = {};

  for (const name of numberParameters) {
    const value = Number(params.get(name) ?? '');
    const isWholeNumber = params.has(name) && Number.isInteger(value) && value > 0;

    if (isWholeNumber) {
      filter[name] = value;
    }
  }
  for (const name of flagParameters) {
    const value = params.get(name);

    const isFlag = value === 'true' || value === 'false';

    if (isFlag) {
      filter[name] = value === 'true';
    }
  }
  for (const name of textParameters) {
    const value = (params.get(name) ?? '').trim();

    if (value !== '') {
      filter[name] = value;
    }
  }
  for (const name of timeParameters) {
    const value = params.get(name) ?? '';
    const moment = new Date(value);
    const isUtcTime = utcTimePattern.test(value) && !Number.isNaN(moment.getTime());

    if (isUtcTime) {
      filter[name] = moment.toISOString();
    }
  }

  return filter;
}

// The query parameters for a filter: what is not set is left out of the address.
export function logFilterToParams(filter: LogFilter): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [name, value] of Object.entries(filter)) {
    const isSet = value !== undefined && value !== '';

    if (isSet) {
      params[name] = String(value);
    }
  }

  return params;
}
