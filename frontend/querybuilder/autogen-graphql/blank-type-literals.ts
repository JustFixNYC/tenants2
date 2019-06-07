import { GraphQLObjectType, isNullableType, isListType, isScalarType, assertNonNullType, isEnumType, GraphQLEnumType } from "graphql";

type TypeLiteral = { [key: string]: any };

const SCALAR_DEFAULTS: { [key: string]: any } = {
  'Int': 0,
  'Float': 0.0,
  'String': '',
  'Boolean': false
};

class UnimplementedError extends Error {
  constructor(actionDesc: string, fieldName: string) {
    super(`Don't know how to ${actionDesc} for field "${fieldName}"`);
  }
}

function getDefaultValueForScalar(name: string, field: string): any {
  const defaultValue = SCALAR_DEFAULTS[name];

  if (defaultValue === undefined) {
    throw new UnimplementedError(`create an empty value for GraphQL scalar type "${name}"`, field);
  }
  return defaultValue;
}

function getDefaultValueForEnum(type: GraphQLEnumType): any {
  return type.getValues()[0].value;
}

function createNonNullableBlank(type: any, field: string): any {
  if (isListType(type)) {
    return [];
  }
  if (isEnumType(type)) {
    return getDefaultValueForEnum(type);
  }
  if (isScalarType(type)) {
    return getDefaultValueForScalar(type.name, field);
  }
  throw new UnimplementedError(`create a blank value for GraphQL type "${type.name}"`, field);
}

export function createBlankTypeLiteral(type: GraphQLObjectType): TypeLiteral {
  const result: TypeLiteral = {};
  for (let field of Object.values(type.getFields())) {
    const { type, name } = field;
    result[name] = isNullableType(type)
      ? null
      : createNonNullableBlank(assertNonNullType(type).ofType, name);
  }
  return result;
}
