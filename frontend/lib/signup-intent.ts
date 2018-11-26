/**
 * The reason the user originally signed up with us. These
 * constants must be kept in-sync with the ones used on
 * the back-end (this is verified by this module's test suite).
 */
export enum SignupIntentChoice {
  /** Letter of complaint */
  LOC = 'LOC',
  /** HP action */
  HP = 'HP'
}

/** The default assumed intent if none is explicitly provided. */
export const DEFAULT_SIGNUP_INTENT_CHOICE = SignupIntentChoice.LOC;

/**
 * Attempt to validate the provided case-insensitive string representation
 * of a choice from a potentially untrusted source, e.g. a querystring,
 * and return either the valid choice or a default value.
 */
export function validateSignupIntent(choice: string|undefined, defaultValue = DEFAULT_SIGNUP_INTENT_CHOICE): SignupIntentChoice {
  if (!choice) return defaultValue;
  choice = choice.toUpperCase();
  for (let s in SignupIntentChoice) {
    if (choice === s) return SignupIntentChoice[s] as SignupIntentChoice;
  }
  return defaultValue;
}
