import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

// Assume we've been compiled to the root project dir.
export const LIB_PATH = path.join('frontend', 'lib', 'queries');
const GEN_PATH = path.join(LIB_PATH, '__generated__');
const SCHEMA_PATH = path.join('schema.json');
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
export class Query {
  /** The base name of the GraphQL query filename, without its extension. */
  basename: string;

  /** The raw GraphQL query. */
  graphQl: string;

  /** The path to the TypeScript code that implements our generated function. */
  tsCodePath: string;

  /** The path to the file containing the raw GraphQL query. */
  graphQlPath: string;

  /** The filename of the Apollo codegen:generate'd Typescript interfaces for the query. */
  tsInterfacesFilename: string;

  /** The path to the Apollo codegen:generate'd Typescript interfaces for the query. */
  tsInterfacesPath: string;

  constructor(readonly graphQlFilename: string, genPath: string = GEN_PATH) {
    const fullPath = path.join(LIB_PATH, graphQlFilename);
    this.graphQlPath = fullPath;
    this.graphQl = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    this.basename = path.basename(graphQlFilename, DOT_GRAPHQL);
    this.tsInterfacesFilename = `${this.basename}.ts`;
    this.tsInterfacesPath = path.join(genPath, this.tsInterfacesFilename);
    this.tsCodePath = path.join(LIB_PATH, `${this.basename}.ts`);
  }

  /** Generate the TypeScript code for our function. */
  generateTsCode(): string {
    if (!fs.existsSync(this.tsInterfacesPath)) {
      throw new Error(`Expected ${this.tsInterfacesPath} to exist!`);
    }

    const tsInterfaces = fs.readFileSync(this.tsInterfacesPath, { encoding: 'utf-8' });

    if (this.graphQl.indexOf(this.basename) === -1) {
      throw new Error(`Expected ${this.graphQlFilename} to define "${this.basename}"!`);
    }
    if (tsInterfaces.indexOf(this.basename) === -1) {
      throw new Error(`Expected ${this.tsInterfacesFilename} to define "${this.basename}"!`);
    }

    let variablesInterfaceName = `${this.basename}Variables`;
    let args = '';

    if (tsInterfaces.indexOf(variablesInterfaceName) !== -1) {
      args = `args: ${variablesInterfaceName}`;
    }

    const fetchGraphQL = 'fetchGraphQL: (query: string, args?: any) => Promise<any>';

    return [
      `// This file was automatically generated and should not be edited.\n`,
      tsInterfaces,
      `export function fetch${this.basename}(${fetchGraphQL}, ${args}): Promise<${this.basename}> {`,
      `  // The following query was taken from ${this.graphQlFilename}.`,
      `  return fetchGraphQL(\`${this.graphQl}\`${args ? ', args' : ''});`,
      `}`
    ].join('\n');
  }

  /** Write out our TypeScript code to a file. */
  writeTsCode() {
    fs.writeFileSync(this.tsCodePath, this.generateTsCode());
  }

  /** Scan the directory containing our GraphQL queries. */
  static fromDir() {
    return fs.readdirSync(LIB_PATH)
      .filter(filename => path.extname(filename) === DOT_GRAPHQL)
      .map(filename => new Query(filename));
  }
}

/**
 * Determine whether we need to run Apollo codegen:generate, based on
 * examining file modification dates.
 */
function doesApolloCodegenNeedToBeRun(): boolean {
  const queries = Query.fromDir();

  const inputFiles = [SCHEMA_PATH, ...queries.map(q => q.graphQlPath)];
  const latestInputMod = Math.max(...inputFiles.map(f => fs.statSync(f).mtimeMs));

  const outputFiles = queries.map(q => q.tsInterfacesPath);
  const earliestOutputMod = Math.min(...outputFiles.map(f => {
    if (!fs.existsSync(f)) return 0;
    return fs.statSync(f).mtimeMs;
  }));

  return latestInputMod > earliestOutputMod;
}

/**
 * Run Apollo codegen:generate if needed.
 * 
 * @param force Force running of Apollo Codegen, regardless of file modification dates.
 */
export function runApolloCodegen(force: boolean = false) {
  if (!force && !doesApolloCodegenNeedToBeRun()) return;

  const child = child_process.spawnSync('node', [
    'node_modules/apollo/bin/run',
    'codegen:generate',
    '--queries', `${LIB_PATH}/*.graphql`,
    '--schema', SCHEMA_PATH,
    '--target', 'typescript'
  ], {
    stdio: 'inherit'
  });
  if (child.error) {
    throw child.error;
  }
  if (child.status !== 0) {
    console.log(`apollo failed, exiting with status ${child.status}.`);
    process.exit(child.status);
  }
}

if (!module.parent) {
  runApolloCodegen();

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
