import * as fs from 'fs';
import * as path from 'path';

import { runApolloCodegen, Query, LIB_PATH } from "../querybuilder";


describe('querybuilder', () => {
  it('should have generated up-to-date TS files based on latest schema and queries', () => {
    runApolloCodegen();
    Query.fromDir().forEach(query => {
      const expected = query.generateTsCode();
      const actual = fs.readFileSync(query.tsCodePath, { encoding: 'utf-8' });

      if (expected != actual) {
        throw new Error('GraphQL queries have changed, please re-run "node querybuilder.js".');
      }
    });
  });

  it('should not have generated any TS files that lack graphQL queries', () => {
    const queries = Query.fromDir();

    fs.readdirSync(LIB_PATH).forEach(filename => {
      if (!/\.ts$/.test(filename)) return;

      const tsCodePath = path.join(LIB_PATH, filename);
      for (let query of queries) {
        if (query.tsCodePath == tsCodePath) {
          return;
        }
      }

      throw new Error(`No matching GraphQL query for ${filename}, perhaps it should be removed?`);
    });
  });
});
