import { GraphQLObjectType, isNullableType, isListType, isScalarType, assertNonNullType } from "graphql";

type TypeLiteral = { [key: string]: any };

function createNonNullableBlank(type: any, fieldName: string): any {
  const err = (msg: string) => new Error(msg + ` for field "${fieldName}"`);

  if (isListType(type)) {
    return [];
  }
  if (isScalarType(type)) {
    if (type.name === 'Int') return 0;
    if (type.name === 'Float') return 0.0;
    if (type.name === 'String') return '';
    if (type.name === 'Boolean') return false;

    throw err(
      `Don't know how to create an empty value for GraphQL scalar type "${type.name}"`
    );
  }
  throw err(`Don't know how to create a blank value for GraphQL type "${type.name}"`);
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
