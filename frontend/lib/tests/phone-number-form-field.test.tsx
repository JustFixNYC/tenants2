import { getFirstTenDigits, unformatPhoneNumber, isRemovedCharNonDigit, formatPhoneNumber } from "../phone-number-form-field";

test("getFirstTenDigits() works", () => {
  expect(getFirstTenDigits("(555) 123-4567 99999999999")).toEqual([
    '5', '5', '5', '1', '2', '3', '4', '5', '6', '7'
  ]);
});

test("unformatPhoneNumber() works", () => {
  expect(unformatPhoneNumber("(555) 123-4567")).toBe("5551234567");
});

describe("isRemovedCharNonDigit()", () => {
  it("returns false when a char was added (not removed)", () => {
    expect(isRemovedCharNonDigit("1a", "1")).toBe(false);
  });

  it("returns true when a non-digit char was removed", () => {
    expect(isRemovedCharNonDigit("1", "1a")).toBe(true);
  });

  it("returns false when a digit char was removed", () => {
    expect(isRemovedCharNonDigit("1", "11")).toBe(false);
  });
});

describe("formatPhoneNumber", () => {
  it("adds characters to make phone numbers more human-readable", () => {
    expect(formatPhoneNumber("1")).toBe("(1");
    expect(formatPhoneNumber("123")).toBe("(123) ");
    expect(formatPhoneNumber("123456")).toBe("(123) 456-");
  });

  it("removes digits along with non-digits on backspace", () => {
    expect(formatPhoneNumber("(123)", "(123) ")).toBe("(12");
  });

  it('truncates phone numbers to ten characters', () => {
    expect(formatPhoneNumber("12345678900")).toBe("(123) 456-7890");
  });
});
