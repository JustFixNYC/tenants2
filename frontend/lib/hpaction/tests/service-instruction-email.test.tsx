import React from "react";
import ReactDOMServer from "react-dom/server";
import {
  ServiceInstructionsContent,
  ExampleServiceInstructionsProps,
  getServiceInstructionsPropsFromSession,
} from "../service-instructions-email";
import { newSb } from "../../tests/session-builder";

const sb = newSb();

describe("ServiceInstructionsContent", () => {
  it("Does not explode", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <ServiceInstructionsContent {...ExampleServiceInstructionsProps} />
    );
    expect(html).toMatch(/serving the papers/i);
  });
});

describe("getServiceInstructionsPropsFromSession()", () => {
  it("returns null when not enough data is available", () => {
    expect(getServiceInstructionsPropsFromSession(sb.value)).toBe(null);
  });

  it("returns props when enough data is available", () => {
    const s = sb.withLoggedInJustfixUser().withHpActionDetails({
      sueForRepairs: true,
      sueForHarassment: false,
    }).value;
    expect(getServiceInstructionsPropsFromSession(s)).toEqual({
      firstName: "Boop",
      borough: "BROOKLYN",
      isNycha: false,
      sueForRepairs: true,
      sueForHarassment: false,
    });
  });
});
