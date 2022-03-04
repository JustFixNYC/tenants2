import { CommonDataConfig } from "../frontend/commondatabuilder/commondatabuilder";

const config: CommonDataConfig = {
  rootDir: __dirname,
  namedConstantsFiles: [
    "loc.json",
    "issue-validation.json",
    "hp-action.json",
    "forms.json",
    "email-attachment-validation.json",
    "amplitude.json",
  ],
  djangoChoicesFiles: [
    {
      jsonFilename: "issue-choices.json",
      typeName: "IssueChoice",
      exportLabels: true,
      internationalizeLabels: true,
      filterOut: /^(LANDLORD__|PUBLIC_AREAS__ILLEGAL_APARTMENTS|HOME__COVID_SANITATION_REQUIRED|HOME__(FRONT_DOOR|DOOR_LOCK|DOORBELL|BUZZER)_BROKEN|KITCHEN__(REFRIGERATOR|STOVE)_BROKEN)/,
    },

    {
      jsonFilename: "issue-area-choices.json",
      typeName: "IssueAreaChoice",
      exportLabels: true,
      filterOut: ["LANDLORD"],
    },
    {
      jsonFilename: "issue-choices-laletterbuilder.json",
      typeName: "LaIssueChoice",
      exportLabels: true,
      internationalizeLabels: true,
    },
    {
      jsonFilename: "issue-category-choices-laletterbuilder.json",
      typeName: "LaIssueCategoryChoice",
      exportLabels: true,
      internationalizeLabels: true,
    },
    {
      jsonFilename: "issue-room-choices-laletterbuilder.json",
      typeName: "LaIssueRoomChoice",
      exportLabels: true,
      internationalizeLabels: true,
    },
    {
      jsonFilename: "borough-choices.json",
      typeName: "BoroughChoice",
      exportLabels: true,
    },
    {
      jsonFilename: "hp-action-choices.json",
      typeName: "HPActionChoice",
      exportLabels: false,
    },
    {
      jsonFilename: "lease-choices.json",
      typeName: "LeaseChoice",
      exportLabels: true,
      filterOut: [],
    },
    {
      jsonFilename: "signup-intent-choices.json",
      typeName: "SignupIntent",
      exportLabels: true,
    },
    {
      jsonFilename: "site-choices.json",
      typeName: "SiteChoice",
      exportLabels: false,
    },
    {
      jsonFilename: "la-letter-builder-letter-choices.json",
      typeName: "LetterChoice",
      internationalizeLabels: true,
      exportLabels: true,
    },
    {
      jsonFilename: "us-state-choices.json",
      typeName: "USStateChoice",
      exportLabels: true,
      internationalizeLabels: true,
      filterOut: ["AS", "GU", "MP", "VI"],
    },
    {
      jsonFilename: "locale-choices.json",
      typeName: "LocaleChoice",
      exportLabels: false,
    },
    {
      jsonFilename: "evictionfree-unsupported-locale-choices.json",
      typeName: "EvictionFreeUnsupportedLocaleChoice",
      exportLabels: true,
    },
  ],
};

export default config;
