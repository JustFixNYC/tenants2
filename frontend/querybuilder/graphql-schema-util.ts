import { GraphQLType, isNonNullType, isListType } from "graphql";

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
export function fullyUnwrapType(type: GraphQLType): GraphQLType {
  while (true) {
    let wrappedType = getWrappedType(type);
    if (wrappedType === null) return type;
    type = wrappedType;
  }
}
