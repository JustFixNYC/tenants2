import {
  GraphQLObjectType,
  isNullableType,
  isListType,
  isScalarType,
  assertNonNullType,
  isEnumType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLField,
} from "graphql";

type TypeLiteral = { [key: string]: any };

const SCALAR_DEFAULTS: { [key: string]: any } = {
  Int: 0,
  Float: 0.0,
  String: "",
  Boolean: false,
};

export type CreateBlankTypeLiteralOptions = Partial<Options>;

type ShouldIgnoreFieldFunc = (
  type: GraphQLNamedType,
  field: GraphQLField<any, any>
) => boolean;

type Options = {
  /**
   * Number of characters to use as white space, or null for no white space.
   * Defaults to 2.
   */
  spaces: number | null;

  /**
   * For nullable fields, if true, leave the field out entirely rather than explicitly
   * setting it to null. Defaults to false.
   */
  excludeNullableFields: boolean;

  /**
   * An optional callback that tells us whether we should ignore a
   * particular field on a type.
   */
  shouldIgnoreField?: ShouldIgnoreFieldFunc;
};

const DEFAULT_OPTIONS: Options = {
  spaces: 2,
  excludeNullableFields: false,
};

/**
 * Create a string of TypeScript code that represents a "blank" object literal
 * for the given GraphQL object type.
 *
 * Note that because TypeScript is quite strict with enums, any GraphQL enum values
 * will assume that the related enum type is visible in the code's enclosing scope.
 */
export function createBlankTypeLiteral(
  type: GraphQLObjectType | GraphQLInputObjectType,
  options?: Partial<Options>
): string {
  const o = Object.assign({}, DEFAULT_OPTIONS, options);
  return stringifyBlankTypeLiteral(
    createBlankTypeLiteralObj(
      type,
      o.excludeNullableFields,
      o.shouldIgnoreField
    ),
    o.spaces
  );
}

function stringifyBlankTypeLiteral(thing: any, spaces: number | null): string {
  const rawJSON = JSON.stringify(
    thing,
    null,
    spaces === null ? undefined : spaces
  );
  return decodeStringsToUnquote(rawJSON);
}

function getDefaultValueForScalar(name: string, field: string): any {
  const defaultValue = SCALAR_DEFAULTS[name];

  if (defaultValue === undefined) {
    throw new UnimplementedError(
      `create an empty value for GraphQL scalar type "${name}"`,
      field
    );
  }
  return defaultValue;
}

function getDefaultValueForEnum(type: GraphQLEnumType): any {
  return encodeStringToUnquote(`${type.name}.${type.getValues()[0].name}`);
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
  throw new UnimplementedError(
    `create a blank value for GraphQL type "${type.name}"`,
    field
  );
}

function maybeAssignNullValue(
  thing: TypeLiteral,
  key: string,
  assignNull: boolean
) {
  if (assignNull) {
    thing[key] = null;
  }
}

function createBlankTypeLiteralObj(
  type: GraphQLObjectType | GraphQLInputObjectType,
  excludeNullableFields: boolean,
  shouldIgnoreField?: ShouldIgnoreFieldFunc
): TypeLiteral {
  const result: TypeLiteral = {};
  for (let field of Object.values(type.getFields())) {
    const { type: fieldType, name, isDeprecated } = field;

    if (isDeprecated || (shouldIgnoreField && shouldIgnoreField(type, field))) {
      continue;
    }

    if (isNullableType(fieldType)) {
      maybeAssignNullValue(result, name, !excludeNullableFields);
    } else {
      result[name] = createNonNullableBlank(
        assertNonNullType(fieldType).ofType,
        name
      );
    }
  }
  return result;
}

/**
 * Exception representing an unimplemented use case.
 *
 * There's actually a bunch of potential use cases we don't currently cover;
 * at least we can make the error output for such situations as helpful
 * as possible.
 */
class UnimplementedError extends Error {
  constructor(actionDesc: string, fieldName: string) {
    super(`Don't know how to ${actionDesc} for field "${fieldName}"`);
  }
}

/**
 * Urg, at first I thought I could represent object literals by
 * stringifying JSON objects, but it turns out that because TypeScript
 * is so strict with respect to enums, that's not possible.
 *
 * So this function is part of a hack that allows us to "munge" an
 * expression into a string and later "un-munge" it so that it's no
 * longer quoted in a string.
 *
 * Note that this whole hack is only possible because we're creating
 * these "blank" object literals with very restrictive limits on
 * their content.
 */
function encodeStringToUnquote(content: string): string {
  return `__unquote(${content})__`;
}

/**
 * The other side of the hack finds the "munged" strings we
 * made earlier and unmunges them.
 */
function decodeStringsToUnquote(content: string): string {
  return content.replace(/\"__unquote\(([A-Za-z0-9._]+)\)__\"/g, "$1");
}
