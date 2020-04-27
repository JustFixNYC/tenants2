import React from "react";

import { NorentLbAskNationalAddress_forUnitTests } from "../ask-national-address";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import {
  NorentNationalAddressMutation_output,
  BlankNorentNationalAddressInput,
} from "../../../queries/NorentNationalAddressMutation";
import { BlankNorentScaffolding } from "../../../queries/NorentScaffolding";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { NorentNationalAddressInput } from "../../../queries/globalTypes";

const {
  getSuccessRedirect,
  ConfirmInvalidAddressModal,
  ConfirmValidAddressModal,
} = NorentLbAskNationalAddress_forUnitTests;

describe("Asking for national address", () => {
  afterEach(AppTesterPal.cleanup);

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
    session: {
      ...BlankAllSessionInfo,
      norentScaffolding: {
        ...BlankNorentScaffolding,
        street: "150 Court Street",
        zipCode: "11201",
      },
    },
  };

  const VALID_OUTPUT = {
    ...OUTPUT,
    isValid: true,
  };

  const INPUT: NorentNationalAddressInput = {
    ...BlankNorentNationalAddressInput,
    street: "150 Court Street",
    zipCode: "11201",
  };

  it("returns next step when no validation occurred on server", () => {
    expect(getSuccessRedirect("/next", OUTPUT, INPUT)).toBe("/next");
  });

  it("returns next step when validation matches input", () => {
    expect(getSuccessRedirect("/next", VALID_OUTPUT, INPUT)).toBe("/next");
  });

  it("returns confirmation modal when validation does not match input", () => {
    expect(
      getSuccessRedirect("/next", VALID_OUTPUT, {
        ...INPUT,
        street: "150 court st",
      })
    ).toMatch(/\/confirm-modal$/);

    expect(
      getSuccessRedirect("/next", VALID_OUTPUT, {
        ...INPUT,
        zipCode: "12345",
      })
    ).toMatch(/\/confirm-modal$/);
  });

  it("returns invalid address confirmation modal when validation fails", () => {
    expect(
      getSuccessRedirect(
        "/next",
        {
          ...VALID_OUTPUT,
          isValid: false,
        },
        INPUT
      )
    ).toMatch(/\/confirm-invalid-modal$/);
  });
});
