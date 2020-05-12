import React from "react";

import { NorentLbAskNationalAddress_forUnitTests } from "../ask-national-address";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import {
  NorentNationalAddressMutation_output,
  BlankNorentNationalAddressInput,
} from "../../../queries/NorentNationalAddressMutation";
import { BlankNorentScaffolding } from "../../../queries/NorentScaffolding";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { override } from "../../../tests/util";

const {
  getSuccessRedirect,
  ConfirmInvalidAddressModal,
  ConfirmValidAddressModal,
  getNationalAddressLines,
} = NorentLbAskNationalAddress_forUnitTests;

describe("getNationalAddressLines() works", () => {
  const scf = override(BlankNorentScaffolding, {
    street: "150 Court Street",
    city: "Boopville",
    state: "OH",
    zipCode: "43216",
  });
  expect(getNationalAddressLines(scf)).toEqual([
    "150 Court Street",
    "Boopville, OH 43216",
  ]);

  scf.aptNumber = "2";
  expect(getNationalAddressLines(scf)).toEqual([
    "150 Court Street #2",
    "Boopville, OH 43216",
  ]);
});

describe("Asking for national address", () => {
  

  it("renders confirm valid address modal", () => {
    const pal = new AppTesterPal(<ConfirmValidAddressModal nextStep="blah" />);
    pal.rr.getByText(/similar address/i);
  });

  it("renders confirm invalid address modal", () => {
    const pal = new AppTesterPal(
      <ConfirmInvalidAddressModal nextStep="blah" />
    );
    pal.rr.getByText(/address is invalid/i);
  });
});

describe("getSuccessRedirect()", () => {
  const OUTPUT: NorentNationalAddressMutation_output = {
    errors: [],
    isValid: null,
    session: override(BlankAllSessionInfo, {
      norentScaffolding: override(BlankNorentScaffolding, {
        street: "150 Court Street",
        zipCode: "11201",
      }),
    }),
  };

  const VALID_OUTPUT = override(OUTPUT, {
    isValid: true,
  });

  const INVALID_OUTPUT = override(OUTPUT, {
    isValid: false,
  });

  const SAME_INPUT = override(BlankNorentNationalAddressInput, {
    street: "150 Court Street",
    zipCode: "11201",
  });

  const DIFF_STREET_INPUT = override(SAME_INPUT, {
    street: "150 court st",
  });

  const DIFF_ZIP_INPUT = override(SAME_INPUT, {
    zipCode: "12345",
  });

  it("returns next step when no validation occurred on server", () => {
    expect(getSuccessRedirect("/next", OUTPUT, SAME_INPUT)).toBe("/next");
  });

  it("returns next step when validation matches input", () => {
    expect(getSuccessRedirect("/next", VALID_OUTPUT, SAME_INPUT)).toBe("/next");
  });

  it("returns confirmation modal when validation does not match input", () => {
    expect(
      getSuccessRedirect("/next", VALID_OUTPUT, DIFF_STREET_INPUT)
    ).toMatch(/\/confirm-modal$/);

    expect(getSuccessRedirect("/next", VALID_OUTPUT, DIFF_ZIP_INPUT)).toMatch(
      /\/confirm-modal$/
    );
  });

  it("returns invalid address confirmation modal when validation fails", () => {
    expect(getSuccessRedirect("/next", INVALID_OUTPUT, SAME_INPUT)).toMatch(
      /\/confirm-invalid-modal$/
    );
  });
});
