import { Console } from 'console';

/* istanbul ignore next: this is tested by integration tests. */
// We don't want to redirect the console to stderr when running
// tests because they will mess up logging output.
if (typeof(describe) !== 'function') {
  Object.defineProperty(global, 'console', {
    value: new Console(process.stderr)
  });
}
