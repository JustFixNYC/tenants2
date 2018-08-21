import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

// Assume we've been compiled to the root project dir.
export const LIB_PATH = path.join('frontend', 'lib', 'queries');
const GEN_PATH = path.join(LIB_PATH, '__generated__');
const SCHEMA_PATH = path.join('schema.json');
const DOT_GRAPHQL = '.graphql';
export const COPY_FROM_GEN_TO_LIB = [
  'globalTypes.ts',
];

/** Returns whether a source string contains any of the given strings. */
export function strContains(source: string, ...strings: string[]): boolean {
  for (let string of strings) {
    if (source.indexOf(string) >= 0) {
      return true;
    }
  }
  return false;
}

/** Returns a list of all fragments the given GraphQL code uses. */
export function getGraphQlFragments(source: string): string[] {
  const re = /\.\.\.([A-Za-z0-9]+)/g;
  const results = [];
  let m = null;

  do {
    m = re.exec(source);
    if (m) {
      results.push(m[1]);
    }
  } while (m);

  return results;
}

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

  /** External fragments that the GraphQL refers to, if any. */
  fragments: string[];

  constructor(readonly graphQlFilename: string, genPath: string = GEN_PATH) {
    const fullPath = path.join(LIB_PATH, graphQlFilename);
    this.graphQlPath = fullPath;
    this.graphQl = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    this.basename = path.basename(graphQlFilename, DOT_GRAPHQL);
    this.tsInterfacesFilename = `${this.basename}.ts`;
    this.tsInterfacesPath = path.join(genPath, this.tsInterfacesFilename);
    this.tsCodePath = path.join(LIB_PATH, `${this.basename}.ts`);
    this.fragments = getGraphQlFragments(this.graphQl);
  }

  /** Returns whether our GraphQL contains any of the given strings. */
  graphQlContains(...strings: string[]): boolean {
    return strContains(this.graphQl, ...strings);
  }

  getGraphQlTemplateLiteral(): string {
    const parts = [this.graphQl];

    this.fragments.forEach(fragmentName => {
      parts.push('${' + fragmentName + '.graphQL}');
    });

    return '`' + parts.join('\n') + '`';
  }

  getTsCodeHeader(): string {
    const lines = [
      '// This file was automatically generated and should not be edited.\n'
    ];

    this.fragments.forEach(fragmentName => {
      lines.push(`import * as ${fragmentName} from './${fragmentName}'`);
    });

    return lines.join('\n');
  }

  /** Generate the TypeScript code that clients will use. */
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

    if (this.graphQlContains(`mutation ${this.basename}`, `query ${this.basename}`)) {
      return this.generateTsCodeForQueryOrMutation(tsInterfaces);
    } else if (this.graphQlContains(`fragment ${this.basename}`)) {
      return this.generateTsCodeForFragment(tsInterfaces);
    } else {
      throw new Error(`${this.basename} is an unrecognized GraphQL type`);
    }
  }

  generateTsCodeForFragment(tsInterfaces: string): string {
    return [
      this.getTsCodeHeader(),
      tsInterfaces,
      `export const graphQL = ${this.getGraphQlTemplateLiteral()};`
    ].join('\n');
  }

  generateTsCodeForQueryOrMutation(tsInterfaces: string): string {
    let variablesInterfaceName = `${this.basename}Variables`;
    let args = '';

    if (tsInterfaces.indexOf(variablesInterfaceName) !== -1) {
      args = `args: ${variablesInterfaceName}`;
    }

    const fetchGraphQL = 'fetchGraphQL: (query: string, args?: any) => Promise<any>';

    return [
      this.getTsCodeHeader(),
      tsInterfaces,
      `export function fetch${this.basename}(${fetchGraphQL}, ${args}): Promise<${this.basename}> {`,
      `  // The following query was taken from ${this.graphQlFilename}.`,
      `  return fetchGraphQL(${this.getGraphQlTemplateLiteral()}${args ? ', args' : ''});`,
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

  const outputFiles = [
    ...COPY_FROM_GEN_TO_LIB.map(filename => path.join(LIB_PATH, filename)),
    ...queries.map(q => q.tsInterfacesPath)
  ];
  const earliestOutputMod = Math.min(...outputFiles.map(f => {
    if (!fs.existsSync(f)) return 0;
    return fs.statSync(f).mtimeMs;
  }));

  return latestInputMod > earliestOutputMod;
}

function fixInvalidGlobaltypesReferences() {
  // This is a fix for a bug in Apollo 1.7.0:
  //
  //   https://github.com/apollographql/apollo-cli/issues/543
  //
  // At the time of this writing, the bug is actually fixed but
  // a new release hasn't been issued yet. Once one has, we should
  // upgrade to it and remove this code.
  fs.readdirSync(GEN_PATH)
    .forEach(filename => {
      const abspath = path.join(GEN_PATH, filename);
      const contents = fs.readFileSync(abspath, { encoding: 'utf-8' })
        .replace('"globalTypes"', '"./globalTypes"');
      fs.writeFileSync(abspath, contents, { encoding: 'utf-8' });
    });
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
    '--target', 'typescript',
    '--outputFlat',
    GEN_PATH,
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

  fixInvalidGlobaltypesReferences();
  COPY_FROM_GEN_TO_LIB.forEach(filename => {
    const content = fs.readFileSync(path.join(GEN_PATH, filename));
    fs.writeFileSync(path.join(LIB_PATH, filename), content);
  });
}

function argvHasOption(...opts: string[]): boolean {
  for (let opt of opts) {
    if (process.argv.indexOf(opt) !== -1) {
      return true;
    }
  }
  return false;
}

if (!module.parent) {
  if (argvHasOption('-h', '--help')) {
    console.log(`usage: ${process.argv[1]} [OPTIONS]\n`);
    console.log(`options:\n`);
    console.log('  -f / --force   Force run Apollo Codgen');
    console.log('  -h / --help    Show this help');
    process.exit(0);
  }

  const forceApolloCodegen = argvHasOption('-f', '--force');

  runApolloCodegen(forceApolloCodegen);

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
