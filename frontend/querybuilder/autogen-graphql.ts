import { GraphQLSchema, GraphQLObjectType, GraphQLType, isNonNullType, isListType, isObjectType } from "graphql";
import { ToolError } from "./util";

type LatestVersion = 1;

const LATEST_VERSION: LatestVersion = 1;

type AutogenConfig = {
  version: LatestVersion,
  fragments: { [name: string]: string },
  ignoreFields: string[]
};

function getWrappedType(type: GraphQLType): GraphQLType|null {
  if (isNonNullType(type)) {
    return type.ofType;
  }
  if (isListType(type)) {
    return type.ofType;
  }
  return null;
}

function fullyUnwrapType(type: GraphQLType): GraphQLType {
  while (true) {
    let wrappedType = getWrappedType(type);
    if (wrappedType === null) return type;
    type = wrappedType;
  }
}

function getQueryForType({
  type,
  indent = '  ',
  fragmentMap,
  ignoreFields
}: {
  type: GraphQLObjectType;
  indent?: string;
  fragmentMap: Map<string, string>;
  ignoreFields: Set<string>
}): string {
  const fields = type.getFields();
  const queryKeys: string[] = [];
  for (let fieldName in fields) {
    if (ignoreFields.has(fieldName)) continue;
    const field = fields[fieldName];
    const type = fullyUnwrapType(field.type);
    if (isObjectType(type)) {
      const fragmentName = fragmentMap.get(type.name);
      if (fragmentName) {
        queryKeys.push(`${indent}${fieldName} { ...${fragmentName} }`);
      } else {
        const subquery = getQueryForType({
          type,
          indent: indent + '  ',
          fragmentMap,
          ignoreFields
        });
        queryKeys.push(`${indent}${fieldName} {\n${subquery}\n${indent}}`);
      }
    } else {
      queryKeys.push(`${indent}${fieldName}`);
    }
  }
  return queryKeys.join(',\n');
}

function objectToMap(object: { [key: string]: string }): Map<string, string> {
  const result = new Map();

  for (let key in object) {
    result.set(key, object[key]);
  }

  return result;
}

type OutputFile = {
  filename: string,
  contents: string
};

export function autogenerateGraphql(config: AutogenConfig, schema: GraphQLSchema): OutputFile[] {
  if (config.version !== LATEST_VERSION) {
    throw new ToolError(
      `Please restart this tool, configuration schema has changed ` +
      `from ${LATEST_VERSION} to ${config.version}`
    );
  }

  const fragmentMap = objectToMap(config.fragments);
  const ignoreFields = new Set(config.ignoreFields);
  const output = [];

  for (let entry of fragmentMap.entries()) {
    const [typeName, fragmentName] = entry;

    const filename = `${fragmentName}.graphql`;
    const type = schema.getType(typeName);

    if (!type || !isObjectType(type)) {
      throw new ToolError(`"${typeName}" is not a valid GraphQL object type.`);
    }

    const queryBody = getQueryForType({
      type,
      fragmentMap,
      ignoreFields
    });
    const contents = `fragment ${fragmentName} on ${typeName} {\n${queryBody}\n}`;

    output.push({ filename, contents });
  }

  return output;
}
