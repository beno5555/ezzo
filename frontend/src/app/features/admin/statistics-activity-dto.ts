import { ActivityCountsDto } from './activity-counts-dto';

// What was created in the last 7 and the last 30 days (the backend's StatisticsActivityDto). The 30-day
// counts include the 7-day ones.
export type StatisticsActivityDto = {
  last7Days: ActivityCountsDto;
  last30Days: ActivityCountsDto;
};
