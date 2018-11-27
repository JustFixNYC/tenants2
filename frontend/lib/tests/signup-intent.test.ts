import { validateDjangoChoices } from "../common-data";
import { validateSignupIntent, DEFAULT_SIGNUP_INTENT_CHOICE } from "../signup-intent";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";

type SignupIntentDjangoChoice = [OnboardingInfoSignupIntent, string];

const SIGNUP_INTENT_CHOICES = require('../../../common-data/signup-intent-choices.json') as SignupIntentDjangoChoice[];

test('SignupIntentChoice has valid choices', () => {
  for (let choice in OnboardingInfoSignupIntent) {
    validateDjangoChoices(SIGNUP_INTENT_CHOICES, [choice, OnboardingInfoSignupIntent[choice]]);
  }
});

test('validateSignupIntent() works', () => {
  expect(validateSignupIntent(undefined)).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(validateSignupIntent('blargh')).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(validateSignupIntent('hp')).toStrictEqual(OnboardingInfoSignupIntent.HP);
  expect(validateSignupIntent('HP')).toStrictEqual(OnboardingInfoSignupIntent.HP);
});
