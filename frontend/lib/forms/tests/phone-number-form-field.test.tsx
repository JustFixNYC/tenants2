import React from "react";

import {
  getFirstTenDigits,
  unformatPhoneNumber,
  isRemovedCharNonDigit,
  formatPhoneNumber,
  PhoneNumberFormFieldProps,
  PhoneNumberFormField,
} from "../phone-number-form-field";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

test("getFirstTenDigits() works", () => {
  expect(getFirstTenDigits("(555) 123-4567 99999999999")).toEqual([
    "5",
    "5",
    "5",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
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

  it("truncates phone numbers to ten characters", () => {
    expect(formatPhoneNumber("12345678900")).toBe("(123) 456-7890");
  });
});

describe("PhoneNumberFormField", () => {
  it("works", () => {
    const label = "wats ur phone number";
    const onChange = jest.fn();
    const props: PhoneNumberFormFieldProps = {
      label,
      value: "123",
      onChange,
      name: "phone",
      id: "phone",
      isDisabled: false,
      labelHint: "use a textable one",
    };
    const pal = new ReactTestingLibraryPal(<PhoneNumberFormField {...props} />);
    const input = pal.rr.getByLabelText(label) as HTMLInputElement;
    expect(input.value).toBe("(123) ");
    pal.fillFormFields([[label, "(123) 4"]]);
    expect(onChange.mock.calls).toEqual([["1234"]]);
  });
});
