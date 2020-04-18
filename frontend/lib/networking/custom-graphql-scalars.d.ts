import { BoroughChoice } from "../../../common-data/borough-choices";
import { LeaseChoice } from "../../../common-data/lease-choices";

declare global {
  /**
   * A custom GraphQL scalar defined by our schema. It's a string with an
   * ISO 8601-formatted timestamp like "2020-03-13T19:41:09+00:00".
   */
  type GraphQLDateTime = string;

  /**
   * A custom GraphQL scalar defined by our schema. It's a string with an
   * ISO 8601-formatted date like "2020-03-13".
   */
  type GraphQLDate = string;

  /** A borough choice or an empty string. */
  type GraphQLOptionalBorough = BoroughChoice | "";

  /** A lease type choice or an empty string. */
  type GraphQLOptionalLeaseType = LeaseChoice | "";
}
