import { metadata as enMetadata } from "../national-metadata-en";
import { setLocalizedNationalMetadata } from "../national-metadata";

export function initNationalMetadataForTesting() {
  setLocalizedNationalMetadata(enMetadata);
}
