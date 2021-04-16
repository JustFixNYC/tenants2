import * as fs from "fs";
import * as path from "path";
import glob from "glob";
import {
  IntrospectionQuery,
  buildClientSchema,
  GraphQLSchema,
  validate,
  parse,
  DocumentNode,
  GraphQLError,
  formatError,
  specifiedRules,
  NoUnusedFragmentsRule,
} from "graphql";
import { getGraphQlFragments, isNonEmptyFileSync } from "./util";
import { assertNotNull } from "@justfixnyc/util";

const rulesMinusUnusedFragments = specifiedRules.filter(
  (rule) => rule !== NoUnusedFragmentsRule
);

function loadSchema(path: string): GraphQLSchema {
  const introspectionQuery: IntrospectionQuery = JSON.parse(
    fs.readFileSync(path, { encoding: "utf-8" })
  ).data;
  return buildClientSchema(introspectionQuery);
}

function isFragment(ast: DocumentNode): boolean {
  return (
    ast.definitions.length > 0 &&
    ast.definitions[0].kind === "FragmentDefinition"
  );
}

function includeFragment(
  query: DocumentNode,
  fragment: DocumentNode
): DocumentNode {
  return {
    ...query,
    definitions: [...query.definitions, ...fragment.definitions],
  };
}

class QueryInfo {
  stem: string;
  basename: string;
  contents: string;
  parseError: GraphQLError | null;
  ast: DocumentNode | null;
  fragmentNames: string[];
  fragments: QueryInfo[];
  validationErrors: string[];
  wasValidateCalled: boolean;
  resolvedAST: DocumentNode | null;

  constructor(readonly filename: string) {
    this.contents = fs.readFileSync(filename, { encoding: "utf-8" });
    this.basename = path.basename(filename);
    this.stem = path.basename(filename, path.extname(filename));
    this.fragmentNames = getGraphQlFragments(this.contents);
    this.parseError = null;
    this.ast = null;
    this.validationErrors = [];
    this.fragments = [];
    this.wasValidateCalled = false;
    this.resolvedAST = null;

    try {
      this.ast = parse(this.contents);
    } catch (e) {
      if (e instanceof GraphQLError) {
        this.parseError = e;
      } else {
        throw e;
      }
    }
  }

  validate(schema: GraphQLSchema, queries: Map<string, QueryInfo>) {
    if (this.wasValidateCalled) return;
    this.wasValidateCalled = true;
    let ast = assertNotNull(this.ast);
    let resolvedAST = ast;
    for (let fragment of this.fragmentNames) {
      let fragQuery = queries.get(fragment);
      if (!fragQuery) {
        this.validationErrors.push(
          `${this.basename}: Reference to fragment '${fragment}' found, ` +
            `but '${fragment}.graphql' does not exist!`
        );
        return;
      }
      fragQuery.validate(schema, queries);
      const fragAST = fragQuery.resolvedAST;
      if (!fragAST) return;
      resolvedAST = includeFragment(resolvedAST, fragAST);
    }
    const rules = isFragment(ast) ? rulesMinusUnusedFragments : specifiedRules;
    const validationErrors = validate(schema, resolvedAST, rules);
    if (validationErrors.length === 0) {
      this.resolvedAST = resolvedAST;
    }
    for (let error of validationErrors) {
      this.validationErrors.push(makeError(this.filename, error));
    }
  }
}

function makeError(filename: string, error: GraphQLError): string {
  const fmtErr = formatError(error);
  const lines = fmtErr.locations
    ? fmtErr.locations.map((loc) => `L${loc.line}`)
    : [];
  return `${path.basename(filename)} ${lines.join(", ")}: ${fmtErr.message}`;
}

export class GraphQLValidator {
  private schema: GraphQLSchema | null;
  private schemaMtime: number;

  constructor(readonly schemaPath: string, readonly queryGlobPattern: string) {
    this.schema = null;
    this.schemaMtime = 0;
  }

  getSchema(): GraphQLSchema {
    const mtime = fs.statSync(this.schemaPath).mtimeMs;
    if (!this.schema || mtime > this.schemaMtime) {
      this.schema = loadSchema(this.schemaPath);
      this.schemaMtime = mtime;
    }
    return this.schema;
  }

  validate(): string[] {
    const schema = this.getSchema();
    const filenames = glob
      .sync(this.queryGlobPattern)
      .filter(isNonEmptyFileSync);
    let queries = new Map<string, QueryInfo>();
    let errors: string[] = [];

    for (let filename of filenames) {
      const query = new QueryInfo(filename);
      if (query.parseError) {
        errors.push(makeError(filename, query.parseError));
      }
      if (queries.has(query.stem)) {
        errors.push(
          `Multiple queries with the name "${query.basename}" exist!`
        );
      }
      queries.set(query.stem, query);
    }

    if (errors.length) return errors;

    for (let query of queries.values()) {
      query.validate(schema, queries);
      errors.push(...query.validationErrors);
    }

    return errors;
  }
}
