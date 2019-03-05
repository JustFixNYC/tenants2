import { DjangoChoicesTypescriptConfig } from '../frontend/commondatabuilder/commondatabuilder';

const config: DjangoChoicesTypescriptConfig = {
  rootDir: __dirname,
  files: [
    {
      jsonFilename: 'issue-choices.json',
      enumName: 'IssueChoice',
      exportLabels: true,
      filterOut: /^LANDLORD__/
    }
  ]
};

export default config;
