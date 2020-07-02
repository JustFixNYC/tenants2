import React from "react";
import { HtmlEmail } from "../html-email";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

describe("HtmlEmail", () => {
  it("works", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <MemoryRouter>
        <HtmlEmail
          subject="here is a subject"
          footer={<p>This is a footer.</p>}
        >
          <p>This is an email!</p>
        </HtmlEmail>
      </MemoryRouter>
    );
    expect(html).toContain("<title>here is a subject</title>");
    expect(html).toContain("<p>This is an email!</p>");
    expect(html).toContain("<p>This is a footer.</p>");
  });
});
