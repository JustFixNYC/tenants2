/**
 * This module provides types and functionality to interact with common data used
 * by both the front-end and back-end.
 */

 /**
  * This data type is used by Django to define a set of choices for a form or
  * model field. The first string is the machine-readable value of the field that
  * is used in data serialization, while the second string is the human-readable
  * label.
  * 
  * For more details, see:
  * 
  *   https://docs.djangoproject.com/en/2.1/ref/models/fields/#choices
  */
export type DjangoChoice = [string, string];

export type DjangoChoices = DjangoChoice[];


/**
 * An enhancement of DjangoChoice that makes it more flexible for use in
 * React-based user interfaces.
 */
export type ReactDjangoChoice = [string, string|JSX.Element];

export type ReactDjangoChoices = ReactDjangoChoice[];


/**
 * Convert an all-caps value, like 'FOO_BAR', to an
 * all-lowercase slug-friendly value, like 'foo-bar'.
 */
export function allCapsToSlug(value: string): string {
  return value.toLowerCase().replace(/_/g, '-');
}

/**
 * Convert an all-lowercase slug-friendly value,
 * like 'foo-bar', to an all-caps value, like
 * 'FOO_BAR'.
 */
export function slugToAllCaps(value: string): string {
  return value.toUpperCase().replace(/-/g, '_');
}

type StringMapping<T extends string> = {
  [k in T]: string
};

/**
 * This combines a list of values to choose from with their
 * labels into a list of DjangoChoices.
 * 
 * @param choices A list of values to choose from.
 * @param labels A mapping from values to their labels.
 */
export function toDjangoChoices<T extends string>(choices: T[], labels: StringMapping<T>): [T, string][] {
  return choices.map(choice => [choice, labels[choice]] as [T, string]);
}
