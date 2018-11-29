import { validateDjangoChoices } from "../common-data";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { signupIntentFromOnboardingInfo, DEFAULT_SIGNUP_INTENT_CHOICE, getOnboardingRouteForIntent } from "../signup-intent";
import { AppTesterPal } from "./app-tester-pal";

type SignupIntentDjangoChoice = [OnboardingInfoSignupIntent, string];

const SIGNUP_INTENT_CHOICES = require('../../../common-data/signup-intent-choices.json') as SignupIntentDjangoChoice[];

test('OnboardingInfoSignupIntent has valid choices', () => {
  for (let choice in OnboardingInfoSignupIntent) {
    validateDjangoChoices(SIGNUP_INTENT_CHOICES, [choice, OnboardingInfoSignupIntent[choice]]);
  }
});

test('signupIntentFromOnboardingInfo() works', () => {
  expect(signupIntentFromOnboardingInfo(null)).toStrictEqual(DEFAULT_SIGNUP_INTENT_CHOICE);
  expect(signupIntentFromOnboardingInfo({ signupIntent: 'boop' } as any)).toBe('boop');
});

describe('getOnboardingRouteForIntent()', () => {
  afterEach(AppTesterPal.cleanup);

  it('works', async () => {
    const pal = new AppTesterPal(getOnboardingRouteForIntent(OnboardingInfoSignupIntent.LOC), {
      url: '/onboarding/step/4'
    });
    const input = await pal.rt.waitForElement(() =>
      pal.getElement('input', '[name="signupIntent"]')
    );
    expect(input && input.value).toBe('LOC');
  });
});
