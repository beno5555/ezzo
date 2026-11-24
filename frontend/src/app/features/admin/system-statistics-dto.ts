import { StatisticsActivityDto } from './statistics-activity-dto';
import { StatisticsTotalsDto } from './statistics-totals-dto';

// How big and how active Ezzo is (the backend's SystemStatisticsDto). onlineUsers counts the users with a
// live connection to the server that answered.
export type SystemStatisticsDto = {
  totals: StatisticsTotalsDto;
  activity: StatisticsActivityDto;
  onlineUsers: number;
};
