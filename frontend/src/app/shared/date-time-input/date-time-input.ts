import {
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Calendar, LabelsOptions, Options, time } from 'vanilla-calendar-pro';
import { Dictionary } from '../../core/languages/dictionary';
import { LanguageStore } from '../../core/languages/language-store';
import { DateTimeParts, joinDateTime, splitDateTime } from './date-time-parts';

// The first day of the week in the calendar: Monday.
const firstWeekday = 1;

// A box that takes a date and a clock time from a calendar that opens under it (vanilla-calendar-pro, in the
// app's colours: calendar-theme.css), in place of the browser's own datetime-local box, whose popup the
// app cannot style. The form value is the same as that box's, "2026-11-20T14:30" (the visitor's own time
// zone, to the minute, no seconds), or empty. The box is read-only: the value is picked, and the Delete or
// Backspace key clears it.
//   <input appTextInput appDateTimeInput id="from" formControlName="from" (picked)="search()" />
// The month and weekday names and the calendar's labels come from the dictionary (Chrome has no Georgian
// date data). The calendar takes the language again when it changes, and the value when the form sets one.
// A date picked without a clock time takes `defaultTime`, which is 00:00; the end of a period asks for
// 23:59, so that the day it names is whole.
@Directive({
  selector: 'input[appDateTimeInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimeInput),
      multi: true,
    },
  ],
  host: {
    type: 'text',
    readonly: '',
    autocomplete: 'off',
    '[attr.aria-description]': 'text().shared.dateTimePicker.clearHint',
    '(keydown)': 'clearOnDelete($event)',
    '(blur)': 'onTouched()',
  },
})
export class DateTimeInput implements ControlValueAccessor {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private calendar: Calendar | null = null;
  private value = '';
  // True while the calendar is being made: it reports its starting state through onChangeToInput, which is
  // not a pick.
  private isBuilding = false;
  private reportChange: (value: string) => void = () => undefined;

  protected readonly text = inject(LanguageStore).text;

  readonly defaultTime = input('00:00');
  // After the reader picks or clears a value (not when the form sets one).
  readonly picked = output<void>();

  constructor() {
    effect(() => {
      this.text();
      untracked(() => this.build());
    });
    inject(DestroyRef).onDestroy(() => this.closeCalendar());
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.build();
  }

  registerOnChange(reportChange: (value: string) => void): void {
    this.reportChange = reportChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.element.disabled = isDisabled;
  }

  // Replaced by the form; host listener of the blur.
  onTouched: () => void = () => undefined;

  protected clearOnDelete(event: KeyboardEvent): void {
    const isClearKey = event.key === 'Delete' || event.key === 'Backspace';

    if (isClearKey && this.value !== '') {
      event.preventDefault();
      this.take('');
    }
  }

  // Gives the calendar the current value and language: makes it the first time, and sets it after.
  // It is never made again: destroying a calendar in input mode swaps the live box for a copy made when the
  // calendar started, which would lose Angular's hold on it.
  private build(): void {
    const parts = splitDateTime(this.value);
    const texts = this.text().shared;
    const options: Options = {
      inputMode: true,
      positionToInput: 'auto',
      selectionDatesMode: 'single',
      selectionTimeMode: 24,
      timeControls: 'all',
      firstWeekday,
      selectedTheme: 'light',
      locale: {
        months: { long: texts.dates.monthsLong, short: texts.dates.monthsShort },
        weekdays: {
          long: texts.dateTimePicker.weekdaysLong,
          short: texts.dateTimePicker.weekdaysShort,
        },
      },
      labels: labelsFrom(texts.dateTimePicker),
      selectedDates: parts === null ? [] : [parts.date],
      selectedTime: parts?.time ?? this.defaultTime(),
      selectedMonth: parts?.month,
      selectedYear: parts?.year,
      onChangeToInput: (self) => {
        if (!this.isBuilding) {
          this.take(joinDateTime(self.context.selectedDates[0], self.context.selectedTime));
        }
      },
    };

    this.isBuilding = true;
    if (this.calendar === null) {
      this.calendar = new Calendar(this.element, { ...options, extensions: [time] });
      this.calendar.init();
    } else {
      this.calendar.set(options, {
        year: true,
        month: true,
        dates: true,
        time: true,
        locale: true,
      });
    }
    this.isBuilding = false;
    this.element.value = this.shown(parts);
  }

  // Ends the calendar's listeners. Destroying it swaps the box for the copy it made at the start, so the live
  // box is put back in the copy's place for Angular to remove.
  private closeCalendar(): void {
    const copy = this.calendar?.context.originalElement;

    this.calendar?.destroy();
    copy?.replaceWith(this.element);
  }

  // A value the reader picked or cleared.
  private take(value: string): void {
    const isChanged = value !== this.value;

    if (isChanged) {
      this.value = value;
      this.element.value = this.shown(splitDateTime(value));
      this.reportChange(value);
      this.picked.emit();
      if (value === '') {
        this.build();
      }
    }
  }

  // The text of the box: "Nov 20, 2026, 14:30" in the interface's language; empty with no value.
  private shown(parts: DateTimeParts | null): string {
    const dates = this.text().shared.dates;
    let shown = '';

    if (parts !== null) {
      const day = Number(parts.date.slice(-2));

      shown = dates.dateAndTime(
        dates.dayMonthYear(day, dates.monthsShort[parts.month], parts.year),
        parts.time,
      );
    }

    return shown;
  }
}

// The calendar's own labels, in the dictionary's words.
function labelsFrom(texts: Dictionary['shared']['dateTimePicker']): LabelsOptions {
  return {
    application: texts.calendarLabel,
    navigation: texts.calendarLabel,
    arrowPrev: { month: texts.previousMonth, year: texts.previousYears },
    arrowNext: { month: texts.nextMonth, year: texts.nextYears },
    month: texts.chooseMonth,
    year: texts.chooseYear,
    inputHour: texts.hours,
    inputMinute: texts.minutes,
  };
}
