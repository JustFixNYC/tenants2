import * as fs from 'fs';
import * as path from 'path';

// Assume we've been compiled to the root project dir.
const LIB_PATH = path.join('frontend', 'lib', 'queries');
const GEN_PATH = path.join(LIB_PATH, '__generated__');
const DOT_GRAPHQL = '.graphql';

/**
 * This class is responsible for taking a raw text
 * GraphQL query, Apollo codegen:generate'd TypeScript
 * interfaces for it, and combining them to form
 * a strongly-typed TS function that wraps the query.
 * 
 * This is partially based on the following blog post,
 * thought it went an extra step to convert the raw
 * text query into an AST, which is way beyond what
 * we need right now, and also way beyond my current
 * understanding of GraphQL:
 * 
 * https://medium.com/@crucialfelix/bridging-the-server-client-gap-graphql-typescript-and-apollo-codegen-e5b54fa96ae2
 */
class Query {
  /** The base name of the GraphQL query filename, without its extension. */
  basename: string;

  /** The raw GraphQL query. */
  graphQl: string;

  /** The Apollo codegen:generate'd TypeScript interfaces for the query. */
  tsInterfaces: string;

  /** The TypeScript interface name for any variables passed to the query. */
  variablesInterfaceName?: string;

  /** The path to the TypeScript code that implements our generated function. */
  tsCodePath: string;

  constructor(readonly graphQlFilename: string) {
    const fullPath = path.join(LIB_PATH, graphQlFilename);
    this.graphQl = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    this.basename = path.basename(graphQlFilename, DOT_GRAPHQL);

    const tsInterfacesFilename = `${this.basename}.ts`;
    const tsInterfacesPath = path.join(GEN_PATH, tsInterfacesFilename);

    if (!fs.existsSync(tsInterfacesPath)) {
      throw new Error(`Expected ${tsInterfacesPath} to exist!`);
    }

    this.tsInterfaces = fs.readFileSync(tsInterfacesPath, { encoding: 'utf-8' });

    if (this.graphQl.indexOf(this.basename) === -1) {
      throw new Error(`Expected ${graphQlFilename} to define "${this.basename}"!`);
    }
    if (this.tsInterfaces.indexOf(this.basename) === -1) {
      throw new Error(`Expected ${tsInterfacesFilename} to define "${this.basename}"!`);
    }

    const variablesInterfaceName = `${this.basename}Variables`;
    if (this.tsInterfaces.indexOf(variablesInterfaceName) !== -1) {
      this.variablesInterfaceName = variablesInterfaceName;
    }

    this.tsCodePath = path.join(LIB_PATH, `${this.basename}.ts`);
  }

  /** Generate the TypeScript code for our function. */
  generateTsCode(): string {
    const args = `args: ${this.variablesInterfaceName}`;

    return [
      `// This file was automatically generated and should not be edited.\n`,
      `import fetchGraphQL from '../fetch-graphql'`,
      this.tsInterfaces,
      `export function fetch${this.basename}(${args}): Promise<${this.basename}> {`,
      `  // The following query was taken from ${this.graphQlFilename}.`,
      `  return fetchGraphQL(\`${this.graphQl}\`, args);`,
      `}`
    ].join('\n');
  }

  /** Write out our TypeScript code to a file. */
  writeTsCode() {
    fs.writeFileSync(this.tsCodePath, this.generateTsCode());
  }

  /** Scan the directory containing our GraphQL queries. */
  static fromDir() {
    return fs
      .readdirSync(LIB_PATH)
      .filter(filename => path.extname(filename) === DOT_GRAPHQL)
      .map(filename => new Query(filename));
  }
}

if (!module.parent) {
  console.log(`Building type-safe functions to access the GraphQL`);
  console.log(`queries in ${LIB_PATH}...\n`);

  // Find all raw GraphQL queries and generate type-safe functions
  // for them.
  Query.fromDir().forEach(query => {
    console.log(`Writing ${query.tsCodePath}...`);
    query.writeTsCode();
  });

  console.log('\nDone!');
}
