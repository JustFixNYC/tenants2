import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  NorentLetterContentProps,
} from "../letter-content";

describe("<NorentLetterContent>", () => {
  afterEach(ReactTestingLibraryPal.cleanup);
  it("works", () => {
    const props: NorentLetterContentProps = {
      firstName: "Boop",
      lastName: "Jones",
      street: "654 Park Place",
      city: "Brooklyn",
      state: "NY",
      zipCode: "12345",
      aptNumber: "2",
      email: "boop@jones.com",
      phoneNumber: "5551234567",
      landlordName: "Landlordo Calrissian",
      landlordPrimaryLine: "1 Cloud City Drive",
      landlordCity: "Bespin",
      landlordState: "OH",
      landlordZipCode: "41235",
      landlordEmail: "landlordo@calrissian.net",
      landlordPhoneNumber: "5552003000",
    };
    const pal = new ReactTestingLibraryPal(<NorentLetterContent {...props} />);
    pal.rr.findByText("Boop Jones");
  });
});
