import {
  areAddressesTheSame,
  redirectToAddressConfirmationOrNextStep,
  RedirectToAddressConfirmationOrNextStepOptions,
  safeGetAddressAndBorough,
} from "../address-confirmation";

test("areAddressesTheSame() works", () => {
  expect(areAddressesTheSame("150 court street   ", "150 COURT STREET")).toBe(
    true
  );
  expect(areAddressesTheSame("150 court st   ", "150 COURT STREET")).toBe(
    false
  );
});

describe("redirectToAddressConfirmationOrNextStep() works", () => {
  const address = "150 court st";
  const borough = "BROOKLYN";
  const baseOptions: RedirectToAddressConfirmationOrNextStepOptions = {
    input: { address, borough },
    resolved: { address, borough },
    confirmation: "confirm",
    nextStep: "next",
  };

  it("returns next step when addresses are identical", () => {
    expect(redirectToAddressConfirmationOrNextStep(baseOptions)).toBe("next");
  });

  it("returns next step when addresses are semantically identical", () => {
    expect(
      redirectToAddressConfirmationOrNextStep({
        ...baseOptions,
        resolved: { address: "  150 COURT ST ", borough },
      })
    ).toBe("next");
  });

  it("returns confirmation when boroughs are different", () => {
    expect(
      redirectToAddressConfirmationOrNextStep({
        ...baseOptions,
        resolved: { address, borough: "MANHATTAN" },
      })
    ).toBe("confirm");
  });

  it("returns confirmation when addresses are different", () => {
    expect(
      redirectToAddressConfirmationOrNextStep({
        ...baseOptions,
        resolved: { address: "borough hall", borough },
      })
    ).toBe("confirm");
  });
});

test("safeGetAddressAndBorough() works", () => {
  expect(safeGetAddressAndBorough(null)).toEqual({
    address: "",
    borough: "",
  });

  expect(
    safeGetAddressAndBorough({
      address: "",
      borough: null,
      fullMailingAddress: "BLARG",
    })
  ).toEqual({
    address: "",
    borough: "",
    fullMailingAddress: "BLARG",
  });
});
