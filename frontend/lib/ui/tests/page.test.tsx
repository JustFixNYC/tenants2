import React from "react";
import { MemoryRouter } from "react-router";

import Page from "../page";
import { HelmetProvider } from "react-helmet-async";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

describe("Page", () => {
  

  it("Renders children", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <HelmetProvider>
          <MemoryRouter>
            <Page title="boop" className="goop">
              hello there
            </Page>
          </MemoryRouter>
        </HelmetProvider>
      )
    );
    expect(pal.getElement("div", ".goop").innerHTML).toContain("hello there");
  });
});
