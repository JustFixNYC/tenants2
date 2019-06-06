/** Returns whether a source string contains any of the given strings. */
export function strContains(source: string, ...strings: string[]): boolean {
  for (let string of strings) {
    if (source.indexOf(string) >= 0) {
      return true;
    }
  }
  return false;
}

/** Returns a list of all fragments the given GraphQL code uses. */
export function getGraphQlFragments(source: string): string[] {
  const re = /\.\.\.([A-Za-z0-9]+)/g;
  const results = [];
  let m = null;

  do {
    m = re.exec(source);
    if (m) {
      results.push(m[1]);
    }
  } while (m);

  return results;
}

/**
 * Return whether our command-line arguments represent any of the given
 * options.
 */
export function argvHasOption(...opts: string[]): boolean {
  for (let opt of opts) {
    if (process.argv.indexOf(opt) !== -1) {
      return true;
    }
  }
  return false;
}

/** A simple debouncer to aid in file watching. */
export function debouncer(func: () => void, debounceMs: number) {
  let timeout: any = null;

  return () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(func,  debounceMs);
  };
}

/**
 * A custom error that indicates an error from a tool, which
 * users can take steps to resolve.
 */
export class ToolError extends Error {}
