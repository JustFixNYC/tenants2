import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { RhEmailToDhcr } from "../email-to-dhcr";
import { exampleRentalHistoryInfo } from "./example-rh-info";

test("email to dhcr renders", () => {
  const pal = new AppTesterPal(<RhEmailToDhcr />, {
    session: {
      rentalHistoryInfo: exampleRentalHistoryInfo,
    },
  });

  expect(pal.rr.container).toMatchSnapshot();
});
