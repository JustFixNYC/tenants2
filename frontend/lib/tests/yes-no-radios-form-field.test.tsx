import { getYesNoChoices } from "../yes-no-radios-form-field";

describe('getYesNoChoices', () => {
  it('works with default options', () => {
    expect(getYesNoChoices({})).toEqual([
      ["True", 'Yes'],
      ["False", 'No'],
    ]);
  });

  it('flips yes/no values if needed', () => {
    expect(getYesNoChoices({flipLabels: true})).toEqual([
      ["False", 'Yes'],
      ["True", 'No'],
    ]);
  });
});
