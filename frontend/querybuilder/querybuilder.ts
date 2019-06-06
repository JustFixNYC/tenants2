import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import {
  reportChanged,
  writeFileIfChangedSync,
} from "./util";
import { GraphQLValidator } from './validator';
import { autogenerateGraphQlFiles } from './autogen-graphql';
import { GraphQlFile } from './graphql-file';
import { GRAPHQL_SCHEMA_PATH, COPY_FROM_APOLLO_GEN_TO_QUERIES, QUERIES_PATH, QUERIES_GLOB, APOLLO_GEN_PATH } from './config';
import { deleteStaleTsFiles } from './stale-ts-files';

/**
 * Determine whether we need to run Apollo codegen:generate, based on
 * examining file modification dates.
 */
function doesApolloCodegenNeedToBeRun(): boolean {
  const queries = GraphQlFile.fromDir();

  const inputFiles = [GRAPHQL_SCHEMA_PATH, ...queries.map(q => q.graphQlPath)];
  const latestInputMod = Math.max(...inputFiles.map(f => fs.statSync(f).mtimeMs));

  const outputFiles = [
    ...COPY_FROM_APOLLO_GEN_TO_QUERIES.map(filename => path.join(QUERIES_PATH, filename)),
    ...queries.map(q => q.tsInterfacesPath)
  ];
  const earliestOutputMod = Math.min(...outputFiles.map(f => {
    if (!fs.existsSync(f)) return 0;
    return fs.statSync(f).mtimeMs;
  }));

  return latestInputMod > earliestOutputMod;
}

/**
 * Run Apollo codegen:generate if needed, returning 0 on success, nonzero on errors.
 * 
 * @param force Force running of Apollo Codegen, regardless of file modification dates.
 */
export function runApolloCodegen(force: boolean = false): number {
  if (!force && !doesApolloCodegenNeedToBeRun()) return 0;

  const child = child_process.spawnSync('node', [
    'node_modules/apollo/bin/run',
    'codegen:generate',
    '--includes', QUERIES_GLOB,
    '--localSchemaFile', GRAPHQL_SCHEMA_PATH,
    '--target', 'typescript',
    '--no-addTypename',
    '--outputFlat',
    APOLLO_GEN_PATH,
  ], {
    stdio: 'inherit'
  });
  if (child.error) {
    throw child.error;
  }
  if (child.status !== 0) {
    return child.status;
  }

  COPY_FROM_APOLLO_GEN_TO_QUERIES.forEach(filename => {
    const content = fs.readFileSync(path.join(APOLLO_GEN_PATH, filename), { encoding: 'utf-8' });
    writeFileIfChangedSync(path.join(QUERIES_PATH, filename), content);
  });
  return 0;
}

/** Options for our main querybuilder functionality. */
export interface MainOptions {
  /** Whether to force-run Apollo codegen:generate even if we don't think it's necessary. */
  forceApolloCodegen: boolean;
}

let validator: GraphQLValidator|null = null;

export function getGlobalValidator(): GraphQLValidator {
  if (!validator) {
    validator = new GraphQLValidator(GRAPHQL_SCHEMA_PATH, QUERIES_GLOB);
  }
  return validator;
}

/**
 * Find all raw GraphQL queries and generate type-safe functions
 * for them. Return a list of the files created.
 * 
 * Files will not be created if they already exist with
 * identical content, to prevent spurious triggering of
 * static asset build pipelines that may be watching.
 */
function generateGraphQlTsFiles(graphQlFiles: GraphQlFile[]): string[] {
  const filesWritten: string[] = [];

  graphQlFiles.forEach(query => {
    if (query.writeTsCode()) {
      filesWritten.push(query.tsCodePath);
    }
  });

  reportChanged(filesWritten, (number, s) =>
    `Generated ${number} TS file${s} from GraphQL queries in ${QUERIES_PATH}.`);

  return filesWritten;
}

/** Our main query-building functionality. */
export function main(options: MainOptions): {
  exitCode: number,
  filesChanged: string[]
} {
  const validator = getGlobalValidator();
  let { graphQlFiles, filesChanged } = autogenerateGraphQlFiles(validator.getSchema());
  const errors = validator.validate();

  if (errors.length) {
    console.log(errors.join('\n'));
    return { exitCode: 1, filesChanged };
  }

  const apolloStatus = runApolloCodegen(options.forceApolloCodegen);
  if (apolloStatus !== 0) {
    return { exitCode: apolloStatus, filesChanged };
  }

  const filesWritten = generateGraphQlTsFiles(graphQlFiles);
  const staleFiles = deleteStaleTsFiles(graphQlFiles);

  filesChanged = [...filesWritten, ...staleFiles, ...filesChanged];

  if (filesChanged.length === 0) {
    console.log(`GraphQL queries in ${QUERIES_PATH} are unchanged, doing nothing.`);
  }

  return { exitCode: 0, filesChanged };
}
