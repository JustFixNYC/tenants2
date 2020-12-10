import { DjangoChoicesTypescriptConfig } from "../frontend/commondatabuilder/commondatabuilder";

const config: DjangoChoicesTypescriptConfig = {
  rootDir: __dirname,
  files: [
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
      filterOut: ["NOT_SURE"],
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
  ],
};

export default config;
