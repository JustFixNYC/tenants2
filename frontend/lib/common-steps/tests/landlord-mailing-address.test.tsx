import React from "react";
import { Route } from "react-router-dom";
import { fireEvent, waitFor } from "@testing-library/react";

import LandlordMailingAddress from "../landlord-mailing-address";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { BlankLandlordDetailsType } from "../../queries/LandlordDetailsType";
import { LandlordDetailsV2Mutation } from "../../queries/LandlordDetailsV2Mutation";

function renderAddress(name: string | null) {
  return new AppTesterPal(
    (
      <Route
        render={(routeProps) => (
          <LandlordMailingAddress
            {...routeProps}
            prevStep="/name"
            nextStep="/next"
            confirmModalRoute="/confirm"
          >
            <p>Mail your letter</p>
          </LandlordMailingAddress>
        )}
      />
    ),
    {
      session: {
        landlordDetails:
          name === null ? null : { ...BlankLandlordDetailsType, name },
      },
    }
  );
}

describe("landlord mailing address with a missing name", () => {
  it.each([null, "", "   "])(
    "lets the user supply a missing name (%s)",
    (name) => {
      const pal = renderAddress(name);
      const input = pal.rr.getByLabelText(
        /Landlord\/management company's name/
      );
      expect(input.hasAttribute("required")).toBe(true);
      fireEvent.change(input, { target: { value: "First character" } });
      expect(
        (pal.rr.getByLabelText(
          /Landlord\/management company's name/
        ) as HTMLInputElement).value
      ).toBe("First character");
    }
  );

  it("displays a name validation error instead of throwing for a hidden field", async () => {
    const pal = renderAddress(null);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(LandlordDetailsV2Mutation).respondWith({
      errors: [
        {
          field: "name",
          extendedMessages: [
            { message: "This field is required.", code: "required" },
          ],
        },
      ],
      session: null,
      isUndeliverable: null,
    });
    await waitFor(() => pal.rr.getByText("This field is required."));
    expect(
      pal.rr.getByLabelText(/Landlord\/management company's name/)
    ).toBeTruthy();
  });

  it("preserves an existing name as a hidden field", () => {
    const pal = renderAddress("Existing Landlord");
    expect(
      pal.rr.queryByLabelText(/Landlord\/management company's name/)
    ).toBeNull();
    expect(
      pal.rr.container
        .querySelector('input[type="hidden"][name="name"]')
        ?.getAttribute("value")
    ).toBe("Existing Landlord");
  });
});
