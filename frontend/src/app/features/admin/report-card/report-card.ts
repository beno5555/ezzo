import { Component, computed, inject, input, output } from '@angular/core';
import { LucideCircleCheck, LucideCircleX, LucideClock, LucideFileX } from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { Button } from '../../../shared/button/button';
import { FadeOut } from '../../../shared/fade-out/fade-out';
import { AdminReportDto } from '../../reports/admin-report-dto';
import { ReportDecision } from '../../reports/report-decision';
import { reportDecisionsOffered } from '../../reports/report-decisions-offered';
import { ReportStatus } from '../../reports/report-status';
import { ReportTargetType } from '../../reports/report-target-type';
import { CommentSnapshot } from '../comment-snapshot/comment-snapshot';
import { PostSnapshot } from '../post-snapshot/post-snapshot';
import { SnapshotAuthor } from '../snapshot-author/snapshot-author';
import { UserSnapshot } from '../user-snapshot/user-snapshot';

// The colour of each status word, which is plain text next to an icon, not a control: the word and the icon
// carry the meaning, the colour only helps (DESIGN.md, Colors).
const statusTextClasses: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: 'text-warning',
  [ReportStatus.Resolved]: 'text-success',
  [ReportStatus.Rejected]: 'text-ink-muted',
};

// One report on the admin reports page: who reported, the reason, and the reported thing inline from the
// backend's snapshot (a post with its photos, a comment with the title of its post, a user with the bio),
// or a mark when the target is gone. A pending report offers Hide, unless its target is gone, and Reject;
// a closed one says who reviewed it and when. It only shows the report: a click asks the page, which
// confirms where it must, sends the decision and fades the card out (SettlingList).
//   <app-report-card [report]="report" [isFading]="list.isFading(report.id)" (decide)="decide(report, $event)" />
@Component({
  selector: 'app-report-card',
  imports: [
    Button,
    CommentSnapshot,
    FadeOut,
    LucideCircleCheck,
    LucideCircleX,
    LucideClock,
    LucideFileX,
    PostSnapshot,
    SnapshotAuthor,
    UserSnapshot,
  ],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
  host: { class: 'block' },
})
export class ReportCard {
  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly ReportDecision = ReportDecision;
  protected readonly ReportStatus = ReportStatus;
  protected readonly ReportTargetType = ReportTargetType;

  readonly report = input.required<AdminReportDto>();
  // True while the card fades out on its way out of the list.
  readonly isFading = input(false);
  readonly decide = output<ReportDecision>();

  protected readonly decisions = computed(() => reportDecisionsOffered(this.report()));
  protected readonly canHide = computed(() => this.decisions().includes(ReportDecision.Hide));
  protected readonly canReject = computed(() => this.decisions().includes(ReportDecision.Reject));
  protected readonly statusClass = computed(() => statusTextClasses[this.report().status]);

  // "Resolved by …" or "Rejected by …", for a closed report whose reviewer and time are known.
  protected readonly reviewLine = computed(() => {
    const { status, reviewedBy, reviewedAt } = this.report();
    const texts = this.text().admin.reports.card;
    const isClosed = status !== ReportStatus.Pending;
    const isKnown = reviewedBy !== null && reviewedAt !== null;
    let line: string | null = null;

    if (isClosed && isKnown) {
      const time = this.dateFormatter.time(reviewedAt);
      line =
        status === ReportStatus.Resolved
          ? texts.resolvedBy(reviewedBy.username, time)
          : texts.rejectedBy(reviewedBy.username, time);
    }

    return line;
  });

  requestDecision(decision: ReportDecision): void {
    this.decide.emit(decision);
  }
}
