import React from "react";
import { RedirectToEnglishPage } from "../redirect-to-english-page";
import { AppTesterPal } from "../../tests/app-tester-pal";

describe("RedirectToEnglishPage", () => {
  it("works", () => {
    const pal = new AppTesterPal(<RedirectToEnglishPage to="/blah" />);
    pal.ensureLinkGoesTo(/take me there/i, "/blah");
  });
});
