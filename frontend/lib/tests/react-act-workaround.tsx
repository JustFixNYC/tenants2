const SUPPRESSED_PREFIXES = [
  "Warning: Do not await the result of calling ReactTestUtils.act(...)",
  "Warning: An update to %s inside a test was not wrapped in act(...)",
];

function isSuppressedErrorMessage(message: string): boolean {
  return SUPPRESSED_PREFIXES.some(sp => message.startsWith(sp));
}

function overrideActErrors() {
  const oldError = window.console.error;

  window.console.error = (...args: any[]) => {
    if (!isSuppressedErrorMessage(args[0])) {
        oldError(...args);
    }
  };

  return oldError;
}

/**
 * This is a workaround for the following issue:
 * 
 *   https://github.com/testing-library/react-testing-library/issues/281
 * 
 * It *should* be fixed in React 16.9, at which point we can remove this.
 */
export async function suppressSpuriousActErrors(cb: () => Promise<any>): Promise<any> {
  const oldError = overrideActErrors();

  try {
    await cb();
  } finally {
    window.console.error = oldError;
  }
}

/**
 * Globally suppresses spurious act() errors for the current test run.
 */
export function globallySuppressSpuriousActErrors() {
  overrideActErrors();
}
