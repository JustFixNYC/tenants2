import React from "react";

import {
  BaseFormFieldProps,
  TextualFormField,
  TextualFormFieldProps,
} from "./form-fields";

/**
 * Return the first ten digits of the given phone number as
 * an array, ignoring any characters that aren't digits.
 */
export function getFirstTenDigits(value: string): string[] {
  return value
    .split("")
    .filter((ch) => /[0-9]/.test(ch))
    .slice(0, 10);
}

/**
 * Convert a phone number into its "unformatted" representation, e.g.
 * "(555) 123-4567" will become "5551234567".
 */
export function unformatPhoneNumber(value: string) {
  return getFirstTenDigits(value).join("");
}

/**
 * Given a value and its previous value, returns whether the state
 * transition represents a backspace at the end of the string, and
 * if so, whether the character removed is a non-digit.
 */
export function isRemovedCharNonDigit(
  value: string,
  prevValue: string
): boolean {
  // Does the current value represents the previous value with its last
  // character removed?
  if (value.length === prevValue.length - 1 && prevValue.indexOf(value) === 0) {
    // Is that character a non-digit?
    const charRemoved = prevValue.charAt(prevValue.length - 1);
    if (!/[0-9]/.test(charRemoved)) {
      return true;
    }
  }
  return false;
}

/**
 * Formats the given phone number to be more human-readable, e.g.
 * "5551234567" becomes "(555) 123-4567".
 *
 * Optionally, the previous value of the phone number (before the user
 * pressed a key) can be provided. The function will automatically detect
 * if the user tried to backspace, and if so, the most recent digit will
 * be removed along with any non-digits, to ensure that habituation of text
 * input isn't broken.
 *
 * @param value The phone number.
 * @param prevValue The optional previous value of the phone number.
 */
export function formatPhoneNumber(value: string, prevValue?: string): string {
  const chars = getFirstTenDigits(value);

  if (
    typeof prevValue === "string" &&
    isRemovedCharNonDigit(value, prevValue)
  ) {
    // The user just deleted a character that was a non-digit,
    // but because we automatically insert such characters for them, it's
    // likely that the user really meant to delete the most recent *digit*,
    // so we will remove that.
    chars.pop();
  }

  return chars.reduce((result, char, i) => {
    if (i === 0) {
      result += "(";
    }
    result += char;
    if (i === 2) {
      result += ") ";
    } else if (i === 5) {
      result += "-";
    }
    return result;
  }, "");
}

export interface PhoneNumberFormFieldProps extends BaseFormFieldProps<string> {
  autoFocus?: boolean;
  label: string;
}

/**
 * A form field for a ten-digit U.S. phone number. The value passed in and
 * returned is an unformatted ten-digit number like "5551234567", but the
 * value displayed to the user is human-readable, like "(555) 123-4567".
 */
export function PhoneNumberFormField(
  props: PhoneNumberFormFieldProps
): JSX.Element {
  const value = formatPhoneNumber(props.value);
  const textFieldProps: TextualFormFieldProps = {
    ...props,
    type: "tel",
    onChange(newValue: string) {
      props.onChange(unformatPhoneNumber(formatPhoneNumber(newValue, value)));
    },
    value,
  };

  return <TextualFormField {...textFieldProps} />;
}
