import React from "react";
import ReactDOMServer from "react-dom/server";
import {
  ServiceInstructionsContent,
  ExampleServiceInstructionsProps,
} from "../service-instructions-email";

describe("ServiceInstructionsContent", () => {
  it("Does not explode", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <ServiceInstructionsContent {...ExampleServiceInstructionsProps} />
    );
    expect(html).toMatch(/serving the papers/i);
  });
});
