import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ActivityCountsDto } from '../activity-counts-dto';
import { AdminApi } from '../admin-api';
import { StatTile } from '../stat-tile/stat-tile';
import { SystemStatisticsDto } from '../system-statistics-dto';

// A heading and the tiles under it.
type StatisticsSection = {
  title: string;
  tiles: { label: string; value: string }[];
};

// The admin panel's statistics area at /admin/statistics: number tiles, no charts. The totals, what was
// created in the last 7 and the last 30 days, and how many users are online now. It reads once, when the
// page opens; leaving the page and coming back reads again.
@Component({
  selector: 'app-admin-statistics-page',
  imports: [LoadFailure, StatTile],
  templateUrl: './admin-statistics-page.html',
  styleUrl: './admin-statistics-page.css',
})
export class AdminStatisticsPage implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly languageStore = inject(LanguageStore);

  protected readonly text = this.languageStore.text;
  protected readonly statistics = signal<SystemStatisticsDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);

  // The numbers with the thousands separator of the chosen language.
  private readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.languageStore.language()),
  );
  // What the page shows once the numbers have arrived, in the order shown.
  protected readonly sections = computed<StatisticsSection[]>(() => {
    const statistics = this.statistics();
    const texts = this.text().admin.statistics;
    const sections: StatisticsSection[] = [];

    if (statistics !== null) {
      const { totals, activity, onlineUsers } = statistics;
      sections.push(
        {
          title: texts.totalsTitle,
          tiles: [
            this.tile(texts.activeAccounts, totals.activeAccounts),
            this.tile(texts.deactivatedAccounts, totals.deactivatedAccounts),
            this.tile(texts.posts, totals.posts),
            this.tile(texts.comments, totals.comments),
            this.tile(texts.messages, totals.messages),
            this.tile(texts.likes, totals.likes),
            this.tile(texts.pendingReports, totals.pendingReports),
          ],
        },
        { title: texts.last7DaysTitle, tiles: this.activityTiles(activity.last7Days) },
        { title: texts.last30DaysTitle, tiles: this.activityTiles(activity.last30Days) },
        { title: texts.onlineTitle, tiles: [this.tile(texts.onlineUsers, onlineUsers)] },
      );
    }

    return sections;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  // Also the Try again button after a failed read.
  async load(): Promise<void> {
    const result = await this.adminApi.getStatistics();

    if (result.succeeded) {
      this.statistics.set(result.data);
      this.failureMessage.set(null);
    } else {
      this.failureMessage.set(result.message);
    }
  }

  private activityTiles(counts: ActivityCountsDto): StatisticsSection['tiles'] {
    const texts = this.text().admin.statistics;

    return [
      this.tile(texts.newAccounts, counts.accounts),
      this.tile(texts.newPosts, counts.posts),
      this.tile(texts.newComments, counts.comments),
      this.tile(texts.newMessages, counts.messages),
    ];
  }

  private tile(label: string, value: number): StatisticsSection['tiles'][number] {
    return { label, value: this.numberFormat().format(value) };
  }
}
