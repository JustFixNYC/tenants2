import { validateDjangoChoices } from "../common-data";
import { SignupIntentChoice } from "../signup-intent";

type SignupIntentDjangoChoice = [SignupIntentChoice, string];

const SIGNUP_INTENT_CHOICES = require('../../../common-data/signup-intent-choices.json') as SignupIntentDjangoChoice[];

test('SignupIntentChoice has valid choices', () => {
  for (let choice in SignupIntentChoice) {
    validateDjangoChoices(SIGNUP_INTENT_CHOICES, [choice, SignupIntentChoice[choice]]);
  }
});
