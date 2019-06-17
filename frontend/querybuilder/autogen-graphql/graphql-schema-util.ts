import { GraphQLType, isNonNullType, isListType, GraphQLNamedType, isObjectType, GraphQLInputObjectType, isInputObjectType } from "graphql";
import { ToolError } from "../util";

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

type GraphQLTypePredicate<T> = (thing: any) => thing is T;

function extractTypeName(fn: GraphQLTypePredicate<any>): string {
  const match = fn.name.match(/is(.*)Type/);
  if (!match) return '???';
  return match[1];
}

type EnsureArg = GraphQLNamedType|null|undefined;

function ensureType<T>(thing: EnsureArg, predicate: GraphQLTypePredicate<T>): T {
  const thingName = thing ? `"${thing.name}"` : (thing === null ? 'null' : 'undefined');
  if (!predicate(thing)) {
    throw new ToolError(`${thingName} is not a valid GraphQL ${extractTypeName(predicate)} type.`);
  }
  return thing;
}

export const ensureObjectType = (thing: EnsureArg) => ensureType(thing, isObjectType);

export function findContainedInputObjectTypes(type: GraphQLInputObjectType): GraphQLInputObjectType[] {
  const results: GraphQLInputObjectType[] = [];

  for (let field of Object.values(type.getFields())) {
    const type = fullyUnwrapType(field.type);
    if (isInputObjectType(type)) {
      results.push(type);
    }
  }

  return results;
}
