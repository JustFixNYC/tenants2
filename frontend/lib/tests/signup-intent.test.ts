import { validateDjangoChoices } from "../common-data";
import { SignupIntentChoice, validateSignupIntent, DEFAULT_SIGNUP_INTENT_CHOICE } from "../signup-intent";

type SignupIntentDjangoChoice = [SignupIntentChoice, string];

const SIGNUP_INTENT_CHOICES = require('../../../common-data/signup-intent-choices.json') as SignupIntentDjangoChoice[];

test('SignupIntentChoice has valid choices', () => {
  for (let choice in SignupIntentChoice) {
    validateDjangoChoices(SIGNUP_INTENT_CHOICES, [choice, SignupIntentChoice[choice]]);
  }
});

test('validateSignupIntent() works', () => {
  expect(validateSignupIntent(undefined)).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(validateSignupIntent('blargh')).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(validateSignupIntent('hp')).toStrictEqual(SignupIntentChoice.HP);
  expect(validateSignupIntent('HP')).toStrictEqual(SignupIntentChoice.HP);
});
