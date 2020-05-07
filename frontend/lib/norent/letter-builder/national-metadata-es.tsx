import RawStateLawForBuilder from "../../../../common-data/norent-state-law-for-builder-es.json";
import RawStateLawForLetter from "../../../../common-data/norent-state-law-for-letter-es.json";
import RawStatePartnersForBuilder from "../../../../common-data/norent-state-partners-for-builder-es.json";
import RawStateDocumentationRequirements from "../../../../common-data/norent-state-documentation-requirements-es.json";
import RawStateLegalAidProviders from "../../../../common-data/norent-state-legal-aid-providers-es.json";
import { LocalizedNationalMetadata } from "./national-metadata.js";

export const metadata: LocalizedNationalMetadata = {
  locale: "es",
  lawForBuilder: RawStateLawForBuilder,
  lawForLetter: RawStateLawForLetter as any,
  partnersForBuilder: RawStatePartnersForBuilder,
  documentationRequirements: RawStateDocumentationRequirements,
  legalAidProviders: RawStateLegalAidProviders,
};
