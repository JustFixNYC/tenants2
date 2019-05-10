/** @jest-environment node */

import * as fs from 'fs';
import * as path from 'path';

import {
  runApolloCodegen,
  GraphQlFile,
  LIB_PATH,
  COPY_FROM_GEN_TO_LIB,
} from "../querybuilder";

describe('querybuilder', () => {
  it('should have generated up-to-date TS files based on latest schema and queries', () => {
    runApolloCodegen();
    GraphQlFile.fromDir().forEach(query => {
      const expected = query.generateTsCode();
      const actual = fs.readFileSync(query.tsCodePath, { encoding: 'utf-8' });

      if (expected != actual) {
        throw new Error('GraphQL queries have changed, please re-run "node querybuilder.js --force".');
      }
    });
  });

  it('should not have generated any TS files that lack graphQL queries/fragments', () => {
    const graphQlFiles = GraphQlFile.fromDir();

    fs.readdirSync(LIB_PATH).forEach(filename => {
      if (!/\.ts$/.test(filename)) return;

      if (COPY_FROM_GEN_TO_LIB.indexOf(filename) !== -1) return;

      const tsCodePath = path.join(LIB_PATH, filename);
      for (let file of graphQlFiles) {
        if (file.tsCodePath == tsCodePath) {
          return;
        }
      }

      throw new Error(`No matching GraphQL file for ${filename}, perhaps it should be removed?`);
    });
  });
});
