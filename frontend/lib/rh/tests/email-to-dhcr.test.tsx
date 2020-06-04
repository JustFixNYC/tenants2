import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { RhEmailToDhcr } from "../email-to-dhcr";

test("email to dhcr renders", () => {
  const pal = new AppTesterPal(<RhEmailToDhcr />, {
    session: {
      rentalHistoryInfo: {
        firstName: "boop",
        lastName: "jones",
        address: "150 DOOMBRINGER STREET",
        apartmentNumber: "2",
        phoneNumber: "2120000000",
        borough: "MANHATTAN",
        zipcode: "10001",
        addressVerified: true,
      },
    },
  });

  expect(pal.rr.container).toMatchSnapshot();
});
