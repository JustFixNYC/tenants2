import * as fs from 'fs';
import toml from 'toml';

import { GraphQLNamedType, GraphQLField, GraphQLObjectType, isObjectType, GraphQLSchema } from "graphql";
import { ToolError } from "./util";

type LatestVersion = 1;

const LATEST_VERSION: LatestVersion = 1;

type TypeConfig = {
  /** A list of fields in GraphQL types to ignore when generating queries. */
  ignoreFields?: string[],

  /** The GraphQL fragment name to create for the type. */
  fragmentName?: string,
};

export type AutogenConfig = {
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

/**
 * This is basically a GraphQL auto-generation configuration that is
 * validated against a GraphQL schema, along with various helper utilities.
 */
export class AutogenContext {
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

function validateBasicConfig(config: AutogenConfig): AutogenConfig {
  if (config.version !== LATEST_VERSION) {
    throw new ToolError(
      `Please restart this tool, configuration schema has changed ` +
      `from ${LATEST_VERSION} to ${config.version}`
    );
  }
  return config;
}

export function loadAutogenConfig(filename: string): AutogenConfig {
  const contents = fs.readFileSync(filename, { encoding: 'utf-8' });
  try {
    return validateBasicConfig(toml.parse(contents));
  } catch (e) {
    throw new ToolError(`Error parsing ${filename}: ${e}`);
  }
}
