import path from 'path';

import chokidar from 'chokidar';
import chalk from 'chalk';
import { main, MainOptions, SCHEMA_PATH, LIB_PATH_PARTS, DOT_GRAPHQL, AUTOGEN_CONFIG_PATH } from './querybuilder';
import { debouncer, ToolError } from './util';


/** Watch GraphQL queries and schema and re-build queries when they change. */
export function watch(options: MainOptions, debounceMs = 250) {
  const paths = [
    SCHEMA_PATH,
    AUTOGEN_CONFIG_PATH,
    path.posix.join(...LIB_PATH_PARTS, `*${DOT_GRAPHQL}`)
  ];
  chokidar.watch(paths).on('all', debouncer(() => {
    let exitCode = 1;

    try {
      exitCode = main(options);
    } catch (e) {
      if (e instanceof ToolError) {
        console.log(e.message);
      } else {
        throw e;
      }
    }

    if (exitCode !== 0) {
      console.log(chalk.redBright('ERROR: Rebuilding GraphQL queries failed!'));
    }
    console.log(`Waiting for changes in ${paths.join(', ')}...`);
  }, debounceMs));
}
