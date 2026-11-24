import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Language } from '../../core/languages/language';
import { LanguageStore } from '../../core/languages/language-store';
import { DateTimeInput } from './date-time-input';

@Component({
  imports: [ReactiveFormsModule, DateTimeInput],
  template: `<input
    appDateTimeInput
    [formControl]="control"
    (picked)="pickedCount = pickedCount + 1"
  />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
  pickedCount = 0;
}

function start(value: string): { host: Host; box: HTMLInputElement } {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.control.setValue(value);
  fixture.detectChanges();

  return {
    host: fixture.componentInstance,
    box: fixture.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

describe('DateTimeInput', () => {
  it('shows a value the form sets as a date and a clock, in the interface language', () => {
    const { box } = start('2026-11-20T14:30');

    expect(box.value).toBe('Nov 20, 2026, 14:30');
  });

  it('shows Georgian month names in Georgian', async () => {
    await TestBed.inject(LanguageStore).setLanguage(Language.Georgian);
    const { box } = start('2026-11-20T14:30');

    expect(box.value).toBe('20 ნოე, 2026, 14:30');
  });

  it('is empty, and read-only, with no value', () => {
    const { box } = start('');

    expect(box.value).toBe('');
    expect(box.readOnly).toBe(true);
  });

  it('is cleared by the Delete key, which tells the form and the page', () => {
    const { host, box } = start('2026-11-20T14:30');

    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', cancelable: true }));

    expect(host.control.value).toBe('');
    expect(box.value).toBe('');
    expect(host.pickedCount).toBe(1);
  });

  it('does not tell the page of a value the form sets itself', () => {
    const { host } = start('2026-11-20T14:30');

    expect(host.pickedCount).toBe(0);
  });
});
