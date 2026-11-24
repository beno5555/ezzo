import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordToggle } from './password-toggle';

@Component({
  imports: [PasswordToggle],
  template: `<form (submit)="$event.preventDefault()">
    <input #password id="password" type="password" />
    <app-password-toggle [target]="password" />
  </form>`,
})
class Host {}

interface Started {
  fixture: ComponentFixture<Host>;
  form: HTMLFormElement;
  box: HTMLInputElement;
  button: HTMLButtonElement;
}

async function start(): Promise<Started> {
  const fixture = TestBed.createComponent(Host);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;

  return {
    fixture,
    form: element.querySelector('form') as HTMLFormElement,
    box: element.querySelector('input') as HTMLInputElement,
    button: element.querySelector('button') as HTMLButtonElement,
  };
}

describe('PasswordToggle', () => {
  it('starts with the password hidden, named for the box it controls', async () => {
    const { box, button } = await start();

    expect(box.type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe('Show password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('password');
  });

  it('shows the password on a press and hides it on the next', async () => {
    const { fixture, box, button } = await start();

    button.click();
    await fixture.whenStable();
    expect(box.type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    await fixture.whenStable();
    expect(box.type).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('hides a shown password when the form is submitted', async () => {
    const { fixture, form, box, button } = await start();
    button.click();
    await fixture.whenStable();

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    expect(box.type).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('never submits the form itself', async () => {
    const { button } = await start();

    expect(button.type).toBe('button');
  });
});
