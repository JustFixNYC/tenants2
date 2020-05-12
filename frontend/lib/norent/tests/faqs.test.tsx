import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NorentFaqsPage, STATES_WITH_LIMITED_PROTECTIONS_ID } from "../faqs";
import { getHTMLElement } from "@justfixnyc/util";

describe("<NorentFaqsPage>", () => {
  

  it("has an entry for the states w/ limited protections ID", () => {
    const pal = new AppTesterPal(<NorentFaqsPage />);
    getHTMLElement(
      "h5",
      `#${STATES_WITH_LIMITED_PROTECTIONS_ID}`,
      pal.rr.container
    );
  });
});
