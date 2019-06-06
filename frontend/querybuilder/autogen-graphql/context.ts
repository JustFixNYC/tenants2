import { GraphQLNamedType, GraphQLField, GraphQLObjectType, isObjectType, GraphQLSchema } from "graphql";
import { AutogenTypeConfig, AutogenConfig } from "./config";
import { ToolError } from "../util";

type ExtendedTypeConfig = AutogenTypeConfig & {
  type: GraphQLNamedType
};

/**
 * This is basically a GraphQL auto-generation configuration that is
 * validated against a GraphQL schema, along with various
 * traversal/validation-related helper utilities.
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

function validateTypeConfig(type: GraphQLNamedType, config: AutogenTypeConfig) {
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
