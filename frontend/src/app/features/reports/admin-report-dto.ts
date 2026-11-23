import { CommentSnapshotDto } from '../moderation/comment-snapshot-dto';
import { PostSnapshotDto } from '../moderation/post-snapshot-dto';
import { MinimalUserDto } from '../users/minimal-user-dto';
import { ReportStatus } from './report-status';
import { ReportTargetType } from './report-target-type';
import { UserSnapshotDto } from './user-snapshot-dto';

// An administrator's view of a report (AdminReportDto). At most one snapshot is set, the one that matches
// targetType; none is set when the target is gone, and targetMissing says so. reviewedBy and reviewedAt are
// null until the report is decided.
export type AdminReportDto = {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  reporter: MinimalUserDto;
  reviewedBy: MinimalUserDto | null;
  createdAt: string;
  reviewedAt: string | null;
  targetMissing: boolean;
  post: PostSnapshotDto | null;
  comment: CommentSnapshotDto | null;
  user: UserSnapshotDto | null;
};
