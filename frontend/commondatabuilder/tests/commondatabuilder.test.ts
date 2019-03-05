import { createDjangoChoicesTypescript, createDjangoChoicesTypescriptFiles } from "../commondatabuilder";

import ourConfig from "../../../common-data/config";

describe('commondatabuilder', () => {
  it('creates django choice typescript', () => {
    const ts = createDjangoChoicesTypescript([['BROOKLYN', 'Brooklyn']], 'BoroughChoice');
    expect(ts).toMatchSnapshot();
  });

  it('only exports labels if configured to', () => {
    expect(createDjangoChoicesTypescript([], 'Foo')).toMatch(/getFooLabels/);
    expect(createDjangoChoicesTypescript([], 'Foo', {
      exportLabels: false
    })).not.toMatch(/getFooLabels/);
  });

  it('works with our common data configuration', () => {
    createDjangoChoicesTypescriptFiles(ourConfig, true);
  });
});
