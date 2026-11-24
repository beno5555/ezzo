import { Component, OnInit, computed, inject, signal } from '@angular/core';
import LucideFlag from 'lucide/dist/esm/icons/flag.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { LIMITS } from '../../../core/limits';
import { ConfirmationOpener } from '../../../shared/confirmation/confirmation-opener';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { Tab } from '../../../shared/tabs/tab';
import { panelId, tabId } from '../../../shared/tabs/tab-ids';
import { Tabs } from '../../../shared/tabs/tabs';
import { ToggleButton } from '../../../shared/toggle-button/toggle-button';
import { AdminReportDto } from '../../reports/admin-report-dto';
import { ReportApi } from '../../reports/report-api';
import { ReportDecision } from '../../reports/report-decision';
import { ReportFilter } from '../../reports/report-filter';
import { ReportStatus } from '../../reports/report-status';
import { ReportTargetType } from '../../reports/report-target-type';
import { reportsClosedWith } from '../../reports/reports-closed-with';
import { ReportCard } from '../report-card/report-card';
import { SettlingList } from '../settling-list';

// The admin panel's reports area at /admin/reports: the reports, page after page as the reader scrolls,
// opening on the pending ones: the status is a row of tabs, what was reported a row of choices under it. Each report shows its
// target inline (ReportCard). A decision on a pending report takes it out of the list at once, and Hide
// takes the other pending reports on the same target with it, as the server closes them together
// (SettlingList). Hide on a user asks first, because it deactivates the account. A filter change makes a
// new list, read from its first page.
@Component({
  selector: 'app-admin-reports-page',
  imports: [EmptyState, LoadFailure, ReportCard, ScrollSentinel, Tabs, ToggleButton, Icon],
  templateUrl: './admin-reports-page.html',
  styleUrl: './admin-reports-page.css',
})
export class AdminReportsPage implements OnInit {
  protected readonly icons = { flag: LucideFlag };

  private readonly reportApi = inject(ReportApi);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly toastStore = inject(ToastStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly tabIdOf = tabId;
  protected readonly panelIdOf = panelId;
  protected readonly tabsIdPrefix = 'reports';

  // The status filter always has a choice, and opens on the pending reports; the target filter's null
  // shows every kind.
  protected readonly selectedStatus = signal<ReportStatus>(ReportStatus.Pending);
  protected readonly selectedTarget = signal<ReportTargetType | null>(null);
  protected readonly statusTabs = computed<Tab[]>(() => {
    const texts = this.text().admin.reports.statuses;

    return Object.values(ReportStatus).map((status) => ({ key: status, label: texts[status] }));
  });
  protected readonly targetChoices = computed(() => {
    const texts = this.text().admin.reports;

    return [
      { target: null, label: texts.allTargets },
      ...Object.values(ReportTargetType).map((target) => ({
        target,
        label: texts.targets[target],
      })),
    ];
  });
  // The list holds the filter it was made with.
  protected readonly list = signal(this.createList({ status: ReportStatus.Pending }));
  protected readonly hasRows = computed(() => this.list().rows().length > 0);

  async ngOnInit(): Promise<void> {
    await this.list().loadNext();
  }

  // From the tabs, which send the key of the tab they show.
  async chooseStatus(key: string): Promise<void> {
    const status = Object.values(ReportStatus).find((choice) => choice === key);

    if (status !== undefined) {
      this.selectedStatus.set(status);
      await this.reload();
    }
  }

  async chooseTarget(target: ReportTargetType | null): Promise<void> {
    this.selectedTarget.set(target);
    await this.reload();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.list().loadNext();
  }

  // Asks first where the decision deactivates an account, then sends it. The report leaves the list on the
  // click; a refusal brings it back with a toast.
  async decide(report: AdminReportDto, decision: ReportDecision): Promise<void> {
    const list = this.list();
    const isUserDeactivation =
      decision === ReportDecision.Hide && report.targetType === ReportTargetType.User;
    const isConfirmed = !isUserDeactivation || (await this.confirmDeactivateUser(report));

    if (isConfirmed) {
      const failure = await list.settle(
        report,
        () => this.reportApi.decide(report.id, decision),
        reportsClosedWith(report, decision, list.rows()),
      );

      if (failure !== null) {
        this.toastStore.show(failure);
      }
    }
  }

  private confirmDeactivateUser(report: AdminReportDto): Promise<boolean> {
    const texts = this.text().admin.reports.confirmDeactivateUser;
    const username = report.user?.username ?? '';

    return this.confirmationOpener.ask({
      question: texts.question(username),
      detail: texts.detail,
      confirmButton: texts.confirmButton,
      isDestructive: true,
    });
  }

  private async reload(): Promise<void> {
    const target = this.selectedTarget();
    const list = this.createList({
      status: this.selectedStatus(),
      targetType: target ?? undefined,
    });

    this.list.set(list);
    await list.loadNext();
  }

  private createList(filter: ReportFilter): SettlingList<AdminReportDto> {
    return new SettlingList<AdminReportDto>({
      loadPage: (page) => this.reportApi.getAll({ ...page, ...filter }),
      pageSize: LIMITS.paging.defaultPageSize,
    });
  }
}
