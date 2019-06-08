import { GraphQLNamedType, GraphQLField, GraphQLObjectType, GraphQLSchema, GraphQLArgument, GraphQLFieldMap, assertObjectType } from "graphql";
import { AutogenTypeConfig, AutogenConfig, AutogenMutationConfig } from "./config";
import { ToolError } from "../util";
import { ensureObjectType, fullyUnwrapType } from "./graphql-schema-util";

type ExtendedTypeConfig = AutogenTypeConfig & {
  type: GraphQLNamedType
};

type ExtendedMutationConfig = AutogenMutationConfig & {
  name: string,
  filename: string,
  fieldName: string,
  inputArg: GraphQLArgument,
  outputType: GraphQLObjectType
};

/**
 * This is basically a GraphQL auto-generation configuration that is
 * validated against a GraphQL schema, along with various
 * traversal/validation-related helper utilities.
 */
export class AutogenContext {
  readonly globalIgnoreFields: Set<string>;
  readonly typeMap: Map<string, ExtendedTypeConfig>;
  readonly mutationMap: Map<string, ExtendedMutationConfig>;

  constructor(readonly config: AutogenConfig, readonly schema: GraphQLSchema) {
    this.globalIgnoreFields = new Set(config.ignoreFields || []);
    this.typeMap = new Map();
    this.mutationMap = new Map();
    this.populateTypeMap();
    this.populateMutationMap();
  }

  private populateTypeMap() {
    for (let entry of Object.entries(this.config.types || {})) {
      const [name, info] = entry;
      const type = this.schema.getType(name);

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

  private populateMutationMap() {
    for (let entry of Object.entries(this.config.mutations || {})) {
      const [name, info] = entry;
      
      this.mutationMap.set(name, getExtendedMutationConfig(this.schema, name, info));
    }
  }

  getFragmentName(type: GraphQLNamedType): string|undefined {
    const typeInfo = this.typeMap.get(type.name);
    if (!typeInfo) return undefined;
    return typeInfo.fragmentName;
  }

  private doesTypeConfigIgnoreField(type: GraphQLNamedType, field: GraphQLField<any, any>): boolean {
    const typeInfo = this.typeMap.get(type.name);
    if (!typeInfo || !typeInfo.ignoreFields) return false;
    return typeInfo.ignoreFields.indexOf(field.name) >= 0;
  }

  shouldIgnoreField(type: GraphQLNamedType, field: GraphQLField<any, any>): boolean {
    return (
      this.globalIgnoreFields.has(field.name) ||
      this.doesTypeConfigIgnoreField(type, field)
    );
  }

  *iterFragmentTypes(): IterableIterator<ExtendedTypeConfig & {
    fragmentName: string,
    type: GraphQLObjectType
  }> {
    for (let typeInfo of this.typeMap.values()) {
      let { type, fragmentName } = typeInfo;
      if (!fragmentName) continue;
      yield { ...typeInfo, fragmentName, type: ensureObjectType(type) };
    }
  }
}

function upperCaseFirstLetter(value: string): string {
  return value[0].toUpperCase() + value.substr(1);
}

function getDefaultMutationName(fieldName: string): string {
  return `${upperCaseFirstLetter(fieldName)}Mutation`;
}

function getMutationFields(schema: GraphQLSchema): GraphQLFieldMap<any, any> {
  const mutations = schema.getMutationType();

  if (!mutations) return {};

  return mutations.getFields();
}

function getExtendedMutationConfig(schema: GraphQLSchema, fieldName: string, config: AutogenMutationConfig): ExtendedMutationConfig {
  const field = getMutationFields(schema)[fieldName];

  if (!field) {
    throw new ToolError(`"${fieldName}" is not a valid mutation name.`);
  }

  if (field.args.length !== 1) {
    throw new ToolError(`Mutation field "${fieldName}" should have one argument.`);
  }

  const inputArg = field.args[0];
  const outputType = assertObjectType(fullyUnwrapType(field.type));
  const name = config.name || getDefaultMutationName(fieldName);
  const filename = `${name}.graphql`;

  return {
    ...config,
    filename,
    name,
    fieldName,
    inputArg,
    outputType
  }
}

function validateTypeConfig(type: GraphQLNamedType, config: AutogenTypeConfig) {
  if (config.ignoreFields) {
    validateIgnoreFields(ensureObjectType(type), config.ignoreFields);
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
