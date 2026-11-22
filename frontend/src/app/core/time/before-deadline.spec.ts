import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeDeadline } from './before-deadline';

describe('beforeDeadline', () => {
  const now = new Date('2026-11-23T10:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is true before the moment and turns false exactly at it', () => {
    const isBefore = TestBed.runInInjectionContext(() => beforeDeadline(() => now + 5_000));
    TestBed.tick();

    expect(isBefore()).toBe(true);
    vi.advanceTimersByTime(4_999);
    expect(isBefore()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isBefore()).toBe(false);
  });

  it('is false at once for a moment that has passed', () => {
    const isBefore = TestBed.runInInjectionContext(() => beforeDeadline(() => now - 1));
    TestBed.tick();

    expect(isBefore()).toBe(false);
  });

  it('does not read the moment where it is made, so a component can use a required input', () => {
    @Component({ selector: 'app-probe', template: '{{ isBefore() }}' })
    class Probe {
      readonly sentAt = input.required<number>();
      readonly isBefore = beforeDeadline(() => this.sentAt() + 5_000);
    }

    const fixture = TestBed.createComponent(Probe);
    fixture.componentRef.setInput('sentAt', now);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('true');
  });

  it('follows a moment that changes, and drops the timer of the old one', () => {
    const deadline = signal(now + 5_000);
    const isBefore = TestBed.runInInjectionContext(() => beforeDeadline(() => deadline()));
    TestBed.tick();

    deadline.set(now + 20_000);
    TestBed.tick();
    vi.advanceTimersByTime(10_000);
    expect(isBefore()).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(isBefore()).toBe(false);
  });
});
