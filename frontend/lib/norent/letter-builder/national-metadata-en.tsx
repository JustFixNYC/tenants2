import RawStateLawForBuilder from "../../../../common-data/norent-state-law-for-builder.json";
import RawStateLawForLetter from "../../../../common-data/norent-state-law-for-letter.json";
import RawStatePartnersForBuilder from "../../../../common-data/norent-state-partners-for-builder.json";
import RawStateDocumentationRequirements from "../../../../common-data/norent-state-documentation-requirements.json";
import RawStateLegalAidProviders from "../../../../common-data/norent-state-legal-aid-providers.json";
import { LocalizedNationalMetadata } from "./national-metadata.js";

export const metadata: LocalizedNationalMetadata = {
  lawForBuilder: RawStateLawForBuilder,
  lawForLetter: RawStateLawForLetter as any,
  partnersForBuilder: RawStatePartnersForBuilder,
  documentationRequirements: RawStateDocumentationRequirements,
  legalAidProviders: RawStateLegalAidProviders,
};
