import { DjangoChoicesTypescriptConfig } from "../frontend/commondatabuilder/commondatabuilder";

const config: DjangoChoicesTypescriptConfig = {
  rootDir: __dirname,
  files: [
    {
      jsonFilename: "issue-choices.json",
      typeName: "IssueChoice",
      exportLabels: true,
      internationalizeLabels: true,
      filterOut: [
        "/^(LANDLORD__|PUBLIC_AREAS__ILLEGAL_APARTMENTS|HOME__COVID_SANITATION_REQUIRED",
        "|HOME__FRONT_DOOR_DEFECTIVE|HOME__DOOR_LOCK_DEFECTIVE|HOME__DOORBELL_DEFECTIVE",
        "|HOME__BUZZER_DEFECTIVE|KITCHEN__REFRIGERATOR_BROKEN|KITCHEN__STOVE_BROKEN)/",
      ],
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
