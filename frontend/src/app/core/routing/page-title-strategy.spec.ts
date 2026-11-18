import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Language } from '../languages/language';
import { LanguageStore } from '../languages/language-store';
import { PageTitleStrategy } from './page-title-strategy';

@Component({ template: '' })
class EmptyPage {}

describe('PageTitleStrategy', () => {
  let harness: RouterTestingHarness;
  let title: Title;

  beforeEach(async () => {
    localStorage.clear();
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'feed', title: 'feed', component: EmptyPage },
          { path: 'friends', title: 'friends', component: EmptyPage },
          { path: 'untitled', component: EmptyPage },
        ]),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
      ],
    });
    harness = await RouterTestingHarness.create();
    title = TestBed.inject(Title);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("names the page by its route's dictionary key, then the app", async () => {
    await harness.navigateByUrl('/feed');
    TestBed.tick();

    expect(title.getTitle()).toBe('Feed – WebCity');
  });

  it('follows the page the user moves to', async () => {
    await harness.navigateByUrl('/feed');
    await harness.navigateByUrl('/friends');
    TestBed.tick();

    expect(title.getTitle()).toBe('Friends – WebCity');
  });

  it('names only the app on a page without a title', async () => {
    await harness.navigateByUrl('/untitled');
    TestBed.tick();

    expect(title.getTitle()).toBe('WebCity');
  });

  it('changes the title in place when the language changes', async () => {
    await harness.navigateByUrl('/feed');
    TestBed.tick();

    TestBed.inject(LanguageStore).setLanguage(Language.Georgian);
    TestBed.tick();

    expect(title.getTitle()).toBe('სიახლეები – WebCity');
  });
});
