import RawStateLawForBuilder from "../../../../common-data/norent-state-law-for-builder-en.json";
import RawStateLawForLetter from "../../../../common-data/norent-state-law-for-letter-en.json";
import RawStatePartnersForBuilder from "../../../../common-data/norent-state-partners-for-builder-en.json";
import RawStateDocumentationRequirements from "../../../../common-data/norent-state-documentation-requirements-en.json";
import RawStateLegalAidProviders from "../../../../common-data/norent-state-legal-aid-providers-en.json";
import { LocalizedNationalMetadata } from "./national-metadata.js";

export const metadata: LocalizedNationalMetadata = {
  locale: "en",
  lawForBuilder: RawStateLawForBuilder,
  lawForLetter: RawStateLawForLetter as any,
  partnersForBuilder: RawStatePartnersForBuilder,
  documentationRequirements: RawStateDocumentationRequirements,
  legalAidProviders: RawStateLegalAidProviders,
};
