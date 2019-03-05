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
 * Retrieve the human-readable label for a choice, given its machine-readable value.
 * 
 * Throw an exception if the choice is invalid.
 */
export function getDjangoChoiceLabel(choices: DjangoChoices, value: string): string {
  const result = safeGetDjangoChoiceLabel(choices, value);
  if (result === null) {
    throw new Error(`Unable to find label for value ${value}`);
  }
  return result;
}

/**
 * Filter out the given values from either the given list of choices, or anything
 * that matches the given regular expression.
 */
export function filterDjangoChoices(choices: DjangoChoices, values: string[]|RegExp): DjangoChoices {
  if (Array.isArray(values)) {
    if (process.env.NODE_ENV !== 'production') {
      validateDjangoChoices(choices, values);
    }
    return choices.filter(([value, _]) => !values.includes(value));
  } else {
    return choices.filter(([value, _]) => !values.test(value));
  }
}

/**
 * Retrieve the human-readable label for a choice, given its machine-readable value.
 * 
 * Return null if the choice is invalid.
 */
export function safeGetDjangoChoiceLabel(choices: DjangoChoices, value: string): string|null {
  for (let [v, label] of choices) {
    if (v === value) return label;
  }
  return null;
}

/**
 * Validate that the given values are valid choices.
 * 
 * This is intended to be used in tests. It should be removed from
 * production bundles via tree-shaking.
 */
export function validateDjangoChoices(choices: DjangoChoices, values: string[]) {
  values.forEach(value => {
    getDjangoChoiceLabel(choices, value);
  });
}

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

export function toDjangoChoices<T extends string>(choices: T[], labels: StringMapping<T>): [string, string][] {
  return choices.map(choice => [choice, labels[choice]] as [string, string]);
}
