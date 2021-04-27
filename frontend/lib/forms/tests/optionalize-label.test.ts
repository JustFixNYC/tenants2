import { optionalizeLabel, optionalizeLabelIf } from "../optionalize-label";

test("optionalizeLabel() works", () => {
  expect(optionalizeLabel("email")).toBe("email (optional)");
});

test("optionalizeLabelIf() works", () => {
  expect(optionalizeLabelIf("email", false)).toBe("email");
  expect(optionalizeLabelIf("email", true)).toBe("email (optional)");
});
