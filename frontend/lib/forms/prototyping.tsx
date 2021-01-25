import { useState } from "react";
import { BaseFormFieldProps } from "./form-fields";

/**
 * React hook to creates form field props useful for prototyping, in
 * situations where we don't have back-end infrastructure to define
 * them for us.
 *
 * This is intended for quick prototyping *only* and should never
 * be used in production code.
 */
export function usePrototypingFormFieldProps<T>(
  name: string,
  initialValue: T
): BaseFormFieldProps<T> {
  const [value, onChange] = useState(initialValue);
  const result: BaseFormFieldProps<T> = {
    onChange,
    value,
    name,
    isDisabled: false,
    id: name,
  };

  return result;
}
