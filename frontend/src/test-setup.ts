// Runs before every spec file. The unit tests share one page per worker (isolation is off), so
// whatever a test stores in the browser would reach the next file on that worker, such as a language
// chosen in one spec turning up as the default in another.
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
