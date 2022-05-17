/**
 * A custom GraphQL scalar defined by our schema. It's a string with an
 * ISO 8601-formatted timestamp like "2020-03-13T19:41:09+00:00".
 */
type GraphQLDateTime = string;

/**
 * A custom GraphQL scalar defined by our schema. It's a string with an
 * ISO 8601-formatted time like "19:41:09+00:00".
 */
type GraphQLTime = string;

/**
 * A custom GraphQL scalar defined by our schema. It's a string with an
 * ISO 8601-formatted date like "2020-03-13".
 */
type GraphQLDate = string;

/**
 * A custom GraphQL scalar defined by our schema. It's a string
 * representing a decimal number, e.g. "3.15".
 */
type GraphQLDecimal = string;
