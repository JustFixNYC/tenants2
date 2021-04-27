import { t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

/**
 * Adds the localized string " (optional)" to the end of the given label string.
 */
export function optionalizeLabel(value: string) {
  return value + " " + li18n._(t`(optional)`);
}

/**
 * Adds the localized string " (optional)" to the end of the given label string
 * if and only if the second argument is true.  Otherwise, it returns the
 * given label string as-is.
 *
 * This is provided to make it easier to conditionally make the
 * label optional, without having to introduce logic into client code.
 */
export function optionalizeLabelIf(value: string, isOptional: boolean) {
  return isOptional ? optionalizeLabel(value) : value;
}
