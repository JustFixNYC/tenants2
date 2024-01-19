import { newSb } from "../../tests/session-builder";

const sb = newSb();

export const exampleRentalHistoryInfo = sb.withOnboardingScaffolding({
  firstName: "boop",
  lastName: "jones",
  street: "150 DOOMBRINGER STREET",
  aptNumber: "2",
  phoneNumber: "2120000000",
  borough: "MANHATTAN",
  zipCode: "10001",
});

export const exampleRhWithReferral = exampleRentalHistoryInfo.withActivePartnerReferral();
