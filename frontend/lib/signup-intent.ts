export enum SignupIntentChoice {
  LOC = 'LOC',
  HP = 'HP'
}

export const DEFAULT_SIGNUP_INTENT_CHOICE = SignupIntentChoice.LOC;

export function validateSignupIntent(choice: string|undefined, defaultValue = DEFAULT_SIGNUP_INTENT_CHOICE): SignupIntentChoice {
  if (!choice) return defaultValue;
  choice = choice.toUpperCase();
  for (let s in SignupIntentChoice) {
    if (choice === s) return SignupIntentChoice[s] as SignupIntentChoice;
  }
  return defaultValue;
}
