import { newSb } from "../../tests/session-builder";

export const exampleRentalHistoryInfo = newSb().withOnboardingScaffolding({
  firstName: "boop",
  lastName: "jones",
  street: "150 DOOMBRINGER STREET",
  aptNumber: "2",
  phoneNumber: "2120000000",
  borough: "MANHATTAN",
  zipCode: "10001",
});
