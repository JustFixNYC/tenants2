import * as fs from 'fs';
import * as path from 'path';
import toml from 'toml';

import { GraphQLSchema, GraphQLObjectType, GraphQLType, isNonNullType, isListType, isObjectType, GraphQLField, GraphQLNamedType } from "graphql";
import { ToolError, writeFileIfChangedSync, reportChanged} from "./util";
import { GraphQlFile } from "./graphql-file";
import { AUTOGEN_PREAMBLE, AUTOGEN_CONFIG_PATH, QUERIES_PATH } from "./config";

type LatestVersion = 1;

const LATEST_VERSION: LatestVersion = 1;

type TypeConfig = {
  /** A list of fields in GraphQL types to ignore when generating queries. */
  ignoreFields?: string[],

  /** The GraphQL fragment name to create for the type. */
  fragmentName?: string,
};

type AutogenConfig = {
  /**
   * The current version of the configuration. If/when we change the configuration format, we
   * may want to increment the version to ensure that developers know they need to
   * restart watcher processes, instead of getting confusing tracebacks.
   */
  version: LatestVersion,

  /**
   * A mapping from GraphQL type names to fragment names. GraphQL queries will be
   * created for each fragment.
   */
  types: { [name: string]: TypeConfig },
};

type ExtendedTypeConfig = TypeConfig & {
  type: GraphQLNamedType
};

class AutogenContext {
  readonly typeMap: Map<string, ExtendedTypeConfig>;

  constructor(readonly config: AutogenConfig, readonly schema: GraphQLSchema) {
    this.typeMap = new Map();

    for (let entry of Object.entries(config.types)) {
      const [name, info] = entry;
      const type = schema.getType(name);

      if (!type) {
        throw new ToolError(`"${name}" is not a valid GraphQL type.`);
      }

      validateTypeConfig(type, info);

      this.typeMap.set(name, {
        ...info,
        type
      });
    }
  }

  getFragmentName(type: GraphQLNamedType): string|undefined {
    const typeInfo = this.typeMap.get(type.name);
    if (!typeInfo) return undefined;
    return typeInfo.fragmentName;
  }

  shouldIgnoreField(type: GraphQLNamedType, field: GraphQLField<any, any>): boolean {
    const typeInfo = this.typeMap.get(type.name);
    if (!typeInfo || !typeInfo.ignoreFields) return false;
    return typeInfo.ignoreFields.indexOf(field.name) >= 0;
  }

  *iterFragmentTypes(): IterableIterator<ExtendedTypeConfig & {
    fragmentName: string,
    type: GraphQLObjectType
  }> {
    for (let typeInfo of this.typeMap.values()) {
      const { type, fragmentName } = typeInfo;
      if (!fragmentName) continue;

      if (!isObjectType(type)) {
        throw new InvalidGraphQlTypeError(type, 'object');
      }

      yield { ...typeInfo, fragmentName, type };
    }
  }
}

class InvalidGraphQlTypeError extends ToolError {
  constructor(type: GraphQLNamedType, typeName: string) {
    super(`"${type.name}" is not a valid GraphQL ${typeName} type.`);
  }
}

function validateTypeConfig(type: GraphQLNamedType, config: TypeConfig) {
  if (config.ignoreFields) {
    if (!isObjectType(type)) {
      throw new InvalidGraphQlTypeError(type, 'object');
    }
    validateIgnoreFields(type, config.ignoreFields);
  }
}

function validateIgnoreFields(type: GraphQLObjectType, ignoreFields: string[]) {
  const fields = type.getFields();
  for (let fieldName of ignoreFields) {
    const field = fields[fieldName];
    if (!field) {
      throw new ToolError(`Field "${fieldName}" does not exist on type "${type.name}".`);
    }
  }
}

/** If the given GraphQL type is a List or NonNull, return the type it wraps. */
function getWrappedType(type: GraphQLType): GraphQLType|null {
  if (isNonNullType(type)) {
    return type.ofType;
  }
  if (isListType(type)) {
    return type.ofType;
  }
  return null;
}

/** Unwrap the given GraphQL type until it can be unwrapped no more! */
function fullyUnwrapType(type: GraphQLType): GraphQLType {
  while (true) {
    let wrappedType = getWrappedType(type);
    if (wrappedType === null) return type;
    type = wrappedType;
  }
}

/**
 * Return a GraphQL query for just the given field and any sub-fields in it.
 */
function getQueryField(field: GraphQLField<any, any>, indent: string, ctx: AutogenContext): string {
  const type = fullyUnwrapType(field.type);
  if (isObjectType(type)) {
    const fragmentName = ctx.getFragmentName(type);
    if (fragmentName) {
      return `${indent}${field.name} { ...${fragmentName} }`;
    } else {
      const subquery = getQueryForType(type, indent + '  ', ctx);
      return `${indent}${field.name} {\n${subquery}\n${indent}}`;
    }
  } else {
    return `${indent}${field.name}`;
  }
}

/**
 * Return a GraphQL query body for all fields in the given type in the schema.
 */
function getQueryForType(type: GraphQLObjectType, indent: string, ctx: AutogenContext): string {
  const fields = type.getFields();
  const queryKeys: string[] = [];
  for (let field of Object.values(fields)) {
    if (!ctx.shouldIgnoreField(type, field)) {
      queryKeys.push(getQueryField(field, indent, ctx));
    }
  }
  return queryKeys.join(',\n');
}

type OutputFile = {
  filename: string,
  contents: string
};

/**
 * Auto-generate GraphQL fragments.
 */
function *generateFragments(ctx: AutogenContext): IterableIterator<OutputFile> {
  for (let typeInfo of ctx.iterFragmentTypes()) {
    const { type, fragmentName } = typeInfo;
    const filename = `${fragmentName}.graphql`;
    const queryBody = getQueryForType(type, '  ', ctx);
    const contents = `fragment ${fragmentName} on ${type.name} {\n${queryBody}\n}`;
    yield { filename, contents };
  }
}

/**
 * Auto-generate GraphQL queries based on our configuration.
 */
function autogenerateGraphql(config: AutogenConfig, schema: GraphQLSchema): OutputFile[] {
  if (config.version !== LATEST_VERSION) {
    throw new ToolError(
      `Please restart this tool, configuration schema has changed ` +
      `from ${LATEST_VERSION} to ${config.version}`
    );
  }

  const ctx = new AutogenContext(config, schema);
  const output = [...generateFragments(ctx)];

  return output;
}

/**
 * Delete any stale GraphQL files if needed, given a list of GraphQL files
 * we know are fresh.
 */
function deleteStaleGraphQlFiles(
  freshFiles: Set<string>,
  dryRun: boolean,
  graphQlFiles = GraphQlFile.fromDir()
) {
  const filesRemoved: string[] = [];
  graphQlFiles = graphQlFiles.filter(file => {
    if (file.graphQl.startsWith(AUTOGEN_PREAMBLE) && !freshFiles.has(file.graphQlFilename)) {
      // This is a stale auto-generated file, remove it.
      filesRemoved.push(file.graphQlFilename);
      if (!dryRun) {
        fs.unlinkSync(file.graphQlPath);
      }
      return false;
    }
    return true;
  });

  return { filesRemoved, graphQlFiles };
}

function loadConfig(filename = AUTOGEN_CONFIG_PATH): AutogenConfig {
  const contents = fs.readFileSync(filename, { encoding: 'utf-8' });
  try {
    return toml.parse(contents);
  } catch (e) {
    throw new ToolError(`Error parsing ${filename}: ${e}`);
  }
}

/**
 * Autogenerate GraphQL files against the given schema, deleting any stale
 * auto-generated GraphQL files if needed.
 */
export function autogenerateGraphQlFiles(schema: GraphQLSchema, dryRun: boolean = false): {
  graphQlFiles: GraphQlFile[],
  filesChanged: string[]
} {
  const autogenConfig = loadConfig();
  const output = autogenerateGraphql(autogenConfig, schema);
  const freshFiles = new Set<string>();
  const filesGenerated: string[] = [];

  output.forEach(({ filename, contents }) => {
    freshFiles.add(filename);
    const fullPath = path.join(QUERIES_PATH, filename);
    if (writeFileIfChangedSync(fullPath, `${AUTOGEN_PREAMBLE}${contents}`, dryRun)) {
      filesGenerated.push(filename);
    }
  });

  const { graphQlFiles, filesRemoved } = deleteStaleGraphQlFiles(freshFiles, dryRun);

  reportChanged(filesGenerated, (number, s) => 
    `Generated ${number} GraphQL query file${s} in ${QUERIES_PATH}.`);

  reportChanged(filesRemoved, (number, s) =>
    `Deleted ${number} stale GraphQL query file${s} from ${QUERIES_PATH}.`);

  return {
    graphQlFiles,
    filesChanged: [...filesGenerated, ...filesRemoved].map(f => path.join(QUERIES_PATH, f))
  };
}
