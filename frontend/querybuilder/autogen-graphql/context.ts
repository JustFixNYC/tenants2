import { GraphQLNamedType, GraphQLField, GraphQLObjectType, GraphQLSchema, GraphQLArgument, GraphQLFieldMap, assertObjectType } from "graphql";
import { AutogenTypeConfig, AutogenConfig, AutogenMutationConfig } from "./config";
import { ToolError } from "../util";
import { ensureObjectType, fullyUnwrapType } from "./graphql-schema-util";

type ExtendedTypeConfig = Omit<AutogenTypeConfig, 'ignoreFields' | 'includeOnlyFields'> & {
  type: GraphQLNamedType,
  ignoreFields?: Set<string>,
  includeOnlyFields?: Set<string>
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

      this.typeMap.set(name, toExtendedTypeConfig(info, type));
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
    if (!typeInfo) return false;

    const { ignoreFields, includeOnlyFields } = typeInfo;
    if (ignoreFields) return ignoreFields.has(field.name);
    if (includeOnlyFields) return !includeOnlyFields.has(field.name);
    return false;
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

function toExtendedTypeConfig(info: AutogenTypeConfig, type: GraphQLNamedType): ExtendedTypeConfig {
  validateTypeConfig(type, info);

  const { ignoreFields, includeOnlyFields, ...baseValue } = info;
  const value: ExtendedTypeConfig = { ...baseValue, type };

  if (ignoreFields) {
    value.ignoreFields = new Set(ignoreFields);
  } else if (includeOnlyFields) {
    value.includeOnlyFields = new Set(includeOnlyFields);
  }

  return value;
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
  const { ignoreFields, includeOnlyFields } = config;
  if (ignoreFields && includeOnlyFields) {
    throw new ToolError(
      `Field "${type.name}" cannot contain both a list of fields to ignore and ` +
      `a list of fields to exclusively include.`
    );
  }
  maybeValidateFieldsExist(type, ignoreFields);
  maybeValidateFieldsExist(type, includeOnlyFields);
}

function maybeValidateFieldsExist(type: GraphQLNamedType, fieldList?: string[]) {
  if (fieldList) {
    validateFieldsExist(ensureObjectType(type), fieldList);
  }
}

function validateFieldsExist(type: GraphQLObjectType, fieldList: string[]) {
  const fields = type.getFields();
  for (let fieldName of fieldList) {
    const field = fields[fieldName];
    if (!field) {
      throw new ToolError(`Field "${fieldName}" does not exist on type "${type.name}".`);
    }
  }
}
