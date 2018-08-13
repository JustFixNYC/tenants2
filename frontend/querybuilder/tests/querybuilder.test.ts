import * as fs from 'fs';

import { runApolloCodegen, Query } from "../querybuilder";


describe('querybuilder', () => {
  it('should be cool', () => {
    runApolloCodegen();
    Query.fromDir().forEach(query => {
      const expected = query.generateTsCode();
      const actual = fs.readFileSync(query.tsCodePath, { encoding: 'utf-8' });

      if (expected != actual) {
        throw new Error('GraphQL queries have changed, please re-run "node querybuilder.js".');
      }
    });
  });
});
