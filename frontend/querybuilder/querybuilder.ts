import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import {
  reportChanged,
  writeFileIfChangedSync,
} from "./util";
import { GraphQLValidator } from './validator';
import { autogenerateGraphQlFiles, generateBlankTypeLiterals } from './autogen-graphql';
import { GraphQlFile, ExtraTsCodeInfo } from './graphql-file';
import { GRAPHQL_SCHEMA_PATH, COPY_FROM_APOLLO_GEN_TO_QUERIES, QUERIES_PATH, QUERIES_GLOB, APOLLO_GEN_PATH, AUTOGEN_CONFIG_PATH } from './config';
import { deleteStaleTsFiles } from './stale-ts-files';
import { AutogenContext } from './autogen-graphql/context';
import { loadAutogenConfig } from './autogen-graphql/config';

function findApollo(): string {
  // TODO: Ideally we should iterate through NODE_PATH.
  for (let p of ['node_modules', path.join('..', 'node_modules')]) {
    const pathname = path.join(p, 'apollo', 'bin', 'run');
    if (fs.existsSync(pathname)) {
      return pathname;
    }
  }
  throw new Error('unable to find apollo!');
}

/**
 * Run Apollo codegen:generate if needed, returning 0 on success, nonzero on errors.
 */
export function runApolloCodegen(): number {
  const child = child_process.spawnSync('node', [
    findApollo(),
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
  // Um, we used to have options but now we don't. Maybe we will again someday.
}

let validator: GraphQLValidator|null = null;

export function getGlobalAutogenContext(): AutogenContext {
  const schema = getGlobalValidator().getSchema();
  return new AutogenContext(loadAutogenConfig(AUTOGEN_CONFIG_PATH), schema);
}

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
function generateGraphQlTsFiles(graphQlFiles: GraphQlFile[], extraTsCode: Map<string, ExtraTsCodeInfo>): string[] {
  const filesWritten: string[] = [];

  graphQlFiles.forEach(query => {
    const extraTsCodeForFile = extraTsCode.get(query.graphQlFilename);
    if (query.writeTsCode(extraTsCodeForFile)) {
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
  const ctx = getGlobalAutogenContext();
  let { graphQlFiles, filesChanged } = autogenerateGraphQlFiles(ctx);
  const errors = getGlobalValidator().validate();

  if (errors.length) {
    console.log(errors.join('\n'));
    return { exitCode: 1, filesChanged };
  }

  const apolloStatus = runApolloCodegen();
  if (apolloStatus !== 0) {
    return { exitCode: apolloStatus, filesChanged };
  }

  const extraTsCode = generateBlankTypeLiterals(ctx);
  const filesWritten = generateGraphQlTsFiles(graphQlFiles, extraTsCode);
  const staleFiles = deleteStaleTsFiles(graphQlFiles);

  filesChanged = [...filesWritten, ...staleFiles, ...filesChanged];

  if (filesChanged.length === 0) {
    console.log(`GraphQL queries in ${QUERIES_PATH} are unchanged, doing nothing.`);
  }

  return { exitCode: 0, filesChanged };
}
