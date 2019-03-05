import { DjangoChoicesTypescriptConfig } from '../frontend/commondatabuilder/commondatabuilder';

const config: DjangoChoicesTypescriptConfig = {
  rootDir: __dirname,
  files: [
    {
      jsonFilename: 'issue-choices.json',
      typeName: 'IssueChoice',
      exportLabels: true,
      filterOut: /^LANDLORD__/
    },
    {
      jsonFilename: 'issue-area-choices.json',
      typeName: 'IssueAreaChoice',
      exportLabels: true,
      filterOut: ['LANDLORD']
    },
    {
      jsonFilename: 'borough-choices.json',
      typeName: 'BoroughChoice',
      exportLabels: true,
    },
    {
      jsonFilename: 'lease-choices.json',
      typeName: 'LeaseChoice',
      exportLabels: true,
      filterOut: ['NOT_SURE']
    }
  ]
};

export default config;
