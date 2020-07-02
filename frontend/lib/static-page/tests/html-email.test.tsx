import React from "react";
import { HtmlEmail } from "../html-email";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

describe("HtmlEmail", () => {
  it("works", () => {
    const html = ReactDOMServer.renderToString(
      <MemoryRouter>
        <HtmlEmail subject="here is a subject">
          <p>This is an email!</p>
        </HtmlEmail>
      </MemoryRouter>
    );
    expect(html).toMatch(/This is an email/);
    expect(html).toMatch(/here is a subject/);
  });
});
