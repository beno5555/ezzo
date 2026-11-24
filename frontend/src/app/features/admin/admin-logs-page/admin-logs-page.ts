import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCircleCheck, LucideCircleX, LucideScrollText, LucideSearch } from '@lucide/angular';
import { map } from 'rxjs';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { localInputToUtc, utcToLocalInput } from '../../../core/time/local-date-time-input';
import { Debouncer, typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { Button } from '../../../shared/button/button';
import { DateTimeInput } from '../../../shared/date-time-input/date-time-input';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FormField } from '../../../shared/form-field/form-field';
import { FormMessage } from '../../../shared/form-message/form-message';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { TextInput } from '../../../shared/text-input/text-input';
import { ToggleButton } from '../../../shared/toggle-button/toggle-button';
import { AdminApi } from '../admin-api';
import { LogFilter } from '../log-filter';
import { splitLogAction } from '../log-action';
import { logFilterFromParams, logFilterToParams } from '../log-filter-address';
import { LogTable } from '../log-table';

// A row id typed in a number box: empty, or a whole number from 1 up that the backend's int can hold.
const idValidators = [
  Validators.min(1),
  Validators.max(LIMITS.logs.maxId),
  Validators.pattern(/^\d+$/),
];

// The filter lives in the address so it survives reloads and can be shared or restored with Back.
// The calendar uses the administrator's time zone. The address and the backend use UTC.
@Component({
  selector: 'app-admin-logs-page',
  imports: [
    ReactiveFormsModule,
    Button,
    DateTimeInput,
    EmptyState,
    FormField,
    FormMessage,
    LoadFailure,
    ScrollSentinel,
    TextInput,
    ToggleButton,
    LucideCircleCheck,
    LucideCircleX,
    LucideScrollText,
    LucideSearch,
  ],
  templateUrl: './admin-logs-page.html',
  styleUrl: './admin-logs-page.css',
})
export class AdminLogsPage {
  private readonly adminApi = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly typingPause = new Debouncer(
    () => this.searchIfChanged(),
    typingPauseMilliseconds,
  );
  private readonly addressFilter = toSignal(
    this.route.queryParamMap.pipe(map((params) => logFilterFromParams(params))),
    { initialValue: {} as LogFilter },
  );

  protected readonly text = inject(LanguageStore).text;
  protected readonly dates = inject(DateFormatter);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly splitAction = splitLogAction;
  protected readonly actionMaxLength = LIMITS.logs.actionMaxLength;
  protected readonly entityNameMaxLength = LIMITS.logs.entityNameMaxLength;
  protected readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // The two filters that are a choice of one: undefined shows every row.
  protected readonly selectedOutcome = signal<boolean | undefined>(undefined);
  protected readonly selectedRequest = signal<boolean | undefined>(undefined);
  protected readonly outcomeChoices = computed(() => {
    const texts = this.text().admin.logs.outcomes;

    return [
      { succeeded: undefined, label: texts.all },
      { succeeded: true, label: texts.succeeded },
      { succeeded: false, label: texts.failed },
    ];
  });
  protected readonly requestChoices = computed(() => {
    const texts = this.text().admin.logs.requests;

    return [
      { authorizedRequest: undefined, label: texts.all },
      { authorizedRequest: true, label: texts.authorized },
      { authorizedRequest: false, label: texts.unauthorized },
    ];
  });
  // The columns, in the order shown; each is also the key of its name in the dictionary.
  protected readonly columnNames = ['time', 'user', 'action', 'entity', 'outcome'] as const;
  protected readonly form = this.formBuilder.group({
    userId: this.formBuilder.control<number | null>(null, idValidators),
    entityId: this.formBuilder.control<number | null>(null, idValidators),
    action: ['', [Validators.maxLength(LIMITS.logs.actionMaxLength)]],
    entityName: ['', [Validators.maxLength(LIMITS.logs.entityNameMaxLength)]],
    from: [''],
    to: [''],
  });
  // Typing or picking a date or time starts the same delay before applying a valid, changed filter.
  // Search, Enter and the outcome or request buttons apply a valid filter immediately.
  protected readonly table = signal<LogTable | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.typingPause.cancel());
    effect(() => {
      const filter = this.addressFilter();
      untracked(() => this.show(filter));
    });
  }

  search(): void {
    this.typingPause.cancel();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    } else {
      void this.go(this.filterFromForm());
    }
  }

  searchAfterTyping(): void {
    this.typingPause.call();
  }

  clear(): void {
    this.typingPause.cancel();
    void this.go({});
  }

  chooseOutcome(succeeded: boolean | undefined): void {
    this.selectedOutcome.set(succeeded);
    this.search();
  }

  chooseRequest(authorizedRequest: boolean | undefined): void {
    this.selectedRequest.set(authorizedRequest);
    this.search();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.table()?.loadNext();
  }

  // Puts the filter in the address; the address then changes and the page shows it. A filter already in
  // the address changes nothing there, so it is shown again here: that is how a failed read is tried again.
  private async go(filter: LogFilter): Promise<void> {
    const isInAddress = addressOf(filter) === addressOf(this.addressFilter());

    if (isInAddress) {
      this.show(filter);
    } else {
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: logFilterToParams(filter),
      });
    }
  }

  private show(filter: LogFilter): void {
    const table = new LogTable(filter, this.adminApi);

    this.form.reset({
      userId: filter.userId ?? null,
      entityId: filter.entityId ?? null,
      action: filter.action ?? '',
      entityName: filter.entityName ?? '',
      from: utcToLocalInput(filter.from),
      to: utcToLocalInput(filter.to),
    });
    this.selectedOutcome.set(filter.succeeded);
    this.selectedRequest.set(filter.authorizedRequest);
    this.table.set(table);
    void table.loadNext(); // the table shows its own failure
  }

  private searchIfChanged(): void {
    if (this.form.valid) {
      const filter = this.filterFromForm();
      const isChanged = addressOf(filter) !== addressOf(this.addressFilter());

      if (isChanged) {
        void this.go(filter);
      }
    }
  }

  private filterFromForm(): LogFilter {
    const values = this.form.getRawValue();

    return {
      userId: values.userId ?? undefined,
      entityId: values.entityId ?? undefined,
      succeeded: this.selectedOutcome(),
      authorizedRequest: this.selectedRequest(),
      action: values.action.trim() || undefined,
      entityName: values.entityName.trim() || undefined,
      from: localInputToUtc(values.from),
      to: localInputToUtc(values.to, true),
    };
  }
}

// A filter as one comparable text, whatever the order its values were written in.
function addressOf(filter: LogFilter): string {
  return JSON.stringify(Object.entries(logFilterToParams(filter)).sort());
}
