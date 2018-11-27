import { validateDjangoChoices } from "../common-data";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { signupIntentFromOnboardingInfo, DEFAULT_SIGNUP_INTENT_CHOICE } from "../signup-intent";

type SignupIntentDjangoChoice = [OnboardingInfoSignupIntent, string];

const SIGNUP_INTENT_CHOICES = require('../../../common-data/signup-intent-choices.json') as SignupIntentDjangoChoice[];

test('SignupIntentChoice has valid choices', () => {
  for (let choice in OnboardingInfoSignupIntent) {
    validateDjangoChoices(SIGNUP_INTENT_CHOICES, [choice, OnboardingInfoSignupIntent[choice]]);
  }
});

test('signupIntentFromOnboardingInfo() works', () => {
  expect(signupIntentFromOnboardingInfo(null)).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(signupIntentFromOnboardingInfo({ signupIntent: 'boop' } as any)).toBe('boop');
});
