import path from 'path';

import chokidar from 'chokidar';
import chalk from 'chalk';
import { main, MainOptions } from './querybuilder';
import { debouncer, ToolError } from './util';
import { GRAPHQL_SCHEMA_PATH, AUTOGEN_CONFIG_PATH, QUERIES_PATH_PARTS, DOT_GRAPHQL } from './config';


function subtractPaths(paths: string[], pathsToRemove: string[]): string[] {
  const setToRemove = new Set(pathsToRemove.map(p => path.resolve(p)));

  return paths.map(p => path.resolve(p)).filter(p => !setToRemove.has(p));
}

/**
 * Run querybuilder and return its exit code. If it threw an
 * error that the user can fix in a way that saving will
 * re-trigger another run of querybuilder, log the error to
 * the console.
 */
function runMain(options: MainOptions): ReturnType<typeof main> {
  try {
    return main(options);
  } catch (e) {
    if (e instanceof ToolError) {
      console.log(e.message);
      return { exitCode: -1, filesChanged: [] }
    } else {
      throw e;
    }
  }
}

const BASE_WATCH_OPTIONS: chokidar.WatchOptions = {
  ignoreInitial: true
};

class QuerybuilderWatcher {
  private filesJustChangedByUs: string[];
  private debouncedOnFileEvent: (...args: any) => void;

  constructor(readonly options: MainOptions, readonly debounceMs: number) {
    this.debouncedOnFileEvent = debouncer(this.onFileEvent.bind(this), debounceMs);
    this.filesJustChangedByUs = [];
  }

  logWaitingMsg() {
    console.log(`Waiting for changes to GraphQL-related files...`);
  }

  onFileEvent(events: any[], pathsChanged: string[]) {
    pathsChanged = subtractPaths(pathsChanged, this.filesJustChangedByUs);
    if (pathsChanged.length === 0) return;

    const result = runMain(this.options);

    // Remember the files that were changed by querybuilder this run;
    // it's possible they may trigger our filesystem watcher, but we
    // want to disregard such "false positives" if possible.
    this.filesJustChangedByUs = result.filesChanged;

    if (result.exitCode !== 0) {
      console.log(chalk.redBright('ERROR: Rebuilding GraphQL queries failed!'));
    }
    this.logWaitingMsg();
  }

  watch() {
    chokidar.watch([
      AUTOGEN_CONFIG_PATH,
      path.posix.join(...QUERIES_PATH_PARTS, `*${DOT_GRAPHQL}`)
    ], BASE_WATCH_OPTIONS).on('all', this.debouncedOnFileEvent);

    chokidar.watch(GRAPHQL_SCHEMA_PATH, {
      ...BASE_WATCH_OPTIONS,
      // The GraphQL schema, in particular, is large and we should wait
      // until its size stabilizes, or else superfluous events will be
      // triggered, causing multiple builds.
      awaitWriteFinish: { stabilityThreshold: 1000 }
    }).on('all', this.debouncedOnFileEvent);

    this.logWaitingMsg();
  }
}

/** Watch GraphQL queries and schema and re-build queries when they change. */
export function watch(options: MainOptions, debounceMs = 250) {
  new QuerybuilderWatcher(options, debounceMs).watch();
}
