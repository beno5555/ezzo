// Runs before every spec file. The unit tests share one page per worker (isolation is off), so
// whatever a test stores in the browser would reach the next file on that worker, such as a language
// chosen in one spec turning up as the default in another.
// jsdom has no IntersectionObserver, which the paged lists' scroll sentinel builds once it renders.
// Without this stand-in the sentinel throws inside an Angular render hook, Angular only logs the
// error, and the test still passes. The stand-in never reports the sentinel as in view: a spec
// loads the next page by calling the page's method itself.
class IntersectionObserverStandIn {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
}

if (!('IntersectionObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: IntersectionObserverStandIn,
    configurable: true,
  });
}

// Specs create their own Angular injectors instead of running main.ts.
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: initialLanguage, useValue: { language: Language.English, text: english } },
    ],
  });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
import { TestBed } from '@angular/core/testing';
import { english } from './app/core/languages/english';
import { initialLanguage } from './app/core/languages/initial-language';
import { Language } from './app/core/languages/language';
