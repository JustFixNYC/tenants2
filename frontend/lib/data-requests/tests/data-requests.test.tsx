import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import DataRequestsRoutes from "../data-requests";
import JustfixRoutes from "../../justfix-routes";
import { DataRequestMultiLandlordQuery } from "../../queries/DataRequestMultiLandlordQuery";
import { waitFor } from "@testing-library/react";

describe("Data requests", () => {
  

  it("should work", async () => {
    const pal = new AppTesterPal(<DataRequestsRoutes />, {
      url: JustfixRoutes.locale.dataRequests.multiLandlord,
    });

    await waitFor(() => pal.rr.getByLabelText(/landlords/i));
    pal.fillFormFields([[/landlords/i, "Boop Jones"]]);
    pal.clickButtonOrLink(/request data/i);

    pal
      .withQuery(DataRequestMultiLandlordQuery)
      .expect({
        landlords: "Boop Jones",
      })
      .respondWith({
        output: {
          snippetRows: JSON.stringify([["blargh"], ["boop"]]),
          snippetMaxRows: 20,
          csvUrl: "http://boop",
        },
      });
    waitFor(() => pal.rr.getByText(/blargh/));
  });
});
