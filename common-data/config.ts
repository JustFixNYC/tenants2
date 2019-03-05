import { DjangoChoicesTypescriptConfig } from '../frontend/commondatabuilder/commondatabuilder';

const config: DjangoChoicesTypescriptConfig = {
  rootDir: __dirname,
  files: [
    {
      jsonFilename: 'issue-choices.json',
      enumName: 'IssueChoice',
      exportLabels: true,
      filterOut: /^LANDLORD__/
    },
    {
      jsonFilename: 'issue-area-choices.json',
      enumName: 'IssueAreaChoice',
      exportLabels: true,
      filterOut: ['LANDLORD']
    },
    {
      jsonFilename: 'borough-choices.json',
      enumName: 'BoroughChoice',
      exportLabels: true,
    },
    {
      jsonFilename: 'lease-choices.json',
      enumName: 'LeaseChoice',
      exportLabels: true,
      filterOut: ['NOT_SURE']
    }
  ]
};

export default config;
