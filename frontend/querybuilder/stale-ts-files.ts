import * as fs from 'fs';
import * as path from 'path';

import { GraphQlFile } from "./graphql-file";
import { QUERIES_PATH, COPY_FROM_APOLLO_GEN_TO_QUERIES } from "./config";
import { reportChanged } from './util';

/**
 * Find all TS files that lack graphQL queries/fragments (presumably because their
 * original query/fragment has been deleted).
 */
export function findStaleTypescriptFiles(graphQlFiles = GraphQlFile.fromDir()): string[] {
  const graphQlCodePaths = new Set(graphQlFiles.map(g => g.tsCodePath));
  const files: string[] = [];

  fs.readdirSync(QUERIES_PATH).forEach(filename => {
    if (!/\.ts$/.test(filename)) return;

    if (COPY_FROM_APOLLO_GEN_TO_QUERIES.indexOf(filename) !== -1) return;

    const tsCodePath = path.join(QUERIES_PATH, filename);
    if (graphQlCodePaths.has(tsCodePath)) return;

    files.push(tsCodePath);
  });

  return files;
}

/**
 * Delete any stale TS files whose associated GraphQL files have been
 * deleted. Return a list of the files deleted.
 */
export function deleteStaleTsFiles(graphQlFiles: GraphQlFile[] = GraphQlFile.fromDir()): string[] {
  const staleFiles = findStaleTypescriptFiles(graphQlFiles);

  staleFiles.forEach(fs.unlinkSync);

  reportChanged(staleFiles, (number, s) =>
    `Deleted ${number} stale TS file${s} from ${QUERIES_PATH}.`);

  return staleFiles;
}
