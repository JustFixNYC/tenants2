import { BoroughChoice, BOROUGH_CHOICES } from "../boroughs";
import { validateDjangoChoices } from "../common-data";

test('BoroughChoice has valid choices', () => {
  for (let choice in BoroughChoice) {
    validateDjangoChoices(BOROUGH_CHOICES, [choice, BoroughChoice[choice]]);
  }
});
