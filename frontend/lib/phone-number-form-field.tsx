import React from 'react';

import { BaseFormFieldProps, TextualFormField, TextualFormFieldProps } from "./form-fields";

function getFirstTenDigits(value: string): string[] {
  return value.split('').filter(ch => /[0-9]/.test(ch)).slice(0, 10);
}

function unformatPhoneNumber(value: string) {
  return getFirstTenDigits(value).join('');
}

export function formatPhoneNumber(value: string, prevValue?: string): string {
  const chars = getFirstTenDigits(value);

  if (typeof(prevValue) === 'string') {
    if (value.length === prevValue.length - 1 &&
        prevValue.indexOf(value) === 0) {
      const charRemoved = prevValue.charAt(prevValue.length - 1);
      if (!/[0-9]/.test(charRemoved)) {
        chars.pop();
      }
    }
  }

  let result = '';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (i === 0) {
      result += '(';
    }
    result += char;
    if (i === 2) {
      result += ') ';
    } else if (i === 5) {
      result += '-';
    }
  }

  return result;
}

export interface PhoneNumberFormFieldProps extends BaseFormFieldProps<string> {
  label: string;
}

export function PhoneNumberFormField(props: PhoneNumberFormFieldProps): JSX.Element {
  const value = formatPhoneNumber(props.value);
  const textFieldProps: TextualFormFieldProps = {
    ...props,
    type: "tel",
    onChange(newValue: string) {
      props.onChange(unformatPhoneNumber(formatPhoneNumber(newValue, value)))
    },
    value
  };

  return (
    <TextualFormField {...textFieldProps} />
  );
}
