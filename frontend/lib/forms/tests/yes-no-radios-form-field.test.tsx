import {
  getYesNoChoices,
  isYesNoChoice,
  optionalBooleanToYesNoChoice,
  optionalBooleanToYesNoLabel,
} from "../yes-no-radios-form-field";

test("isYesNoChoice() works", () => {
  expect(isYesNoChoice("bleh")).toBe(false);
  expect(isYesNoChoice("True")).toBe(true);
  expect(isYesNoChoice("False")).toBe(true);
});

describe("getYesNoChoices", () => {
  it("works with default options", () => {
    expect(getYesNoChoices({})).toEqual([
      ["True", "Yes"],
      ["False", "No"],
    ]);
  });

  it("flips yes/no values if needed", () => {
    expect(getYesNoChoices({ flipLabels: true })).toEqual([
      ["False", "Yes"],
      ["True", "No"],
    ]);
  });

  it("provides custom labels if provided", () => {
    expect(getYesNoChoices({ yesLabel: "YUP", noLabel: "NOPE" })).toEqual([
      ["True", "YUP"],
      ["False", "NOPE"],
    ]);
  });
});

test("optionalBooleanToYesNoLabel() works", () => {
  expect(optionalBooleanToYesNoLabel(null)).toBe("");
  expect(optionalBooleanToYesNoLabel(true)).toBe("Yes");
  expect(optionalBooleanToYesNoLabel(false)).toBe("No");
});

test("optionalBooleanToYesNoChoice() works", () => {
  expect(optionalBooleanToYesNoChoice(null)).toBe("");
  expect(optionalBooleanToYesNoChoice(true)).toBe("True");
  expect(optionalBooleanToYesNoChoice(false)).toBe("False");
});
