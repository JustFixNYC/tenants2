import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import DataRequestsRoutes from "../data-requests";
import Routes from "../../justfix-routes";
import { DataRequestMultiLandlordQuery } from "../../queries/DataRequestMultiLandlordQuery";
import { wait } from "@testing-library/react";

describe("Data requests", () => {
  afterEach(AppTesterPal.cleanup);

  it("should work", async () => {
    const pal = new AppTesterPal(<DataRequestsRoutes />, {
      url: Routes.locale.dataRequests.multiLandlord,
    });

    await wait(() => pal.rr.getByLabelText(/landlords/i));
    pal.fillFormFields([[/landlords/i, "Boop Jones"]]);
    pal.clickButtonOrLink(/request data/i);

    pal.expectGraphQL(/DataRequestMultiLandlordQuery/);

    const response: DataRequestMultiLandlordQuery = {
      output: {
        snippetRows: JSON.stringify([["blargh"], ["boop"]]),
        snippetMaxRows: 20,
        csvUrl: "http://boop",
      },
    };

    pal.getFirstRequest().resolve(response);
    wait(() => pal.rr.getByText(/blargh/));
  });
});
