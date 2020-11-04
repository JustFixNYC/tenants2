import React from "react";
import ReactDOMServer from "react-dom/server";
import {
  ServiceInstructionsContent,
  ExampleServiceInstructionsProps,
  getServiceInstructionsPropsFromSession,
  ExampleServiceInstructionsEmailForm,
  ServiceInstructionsWebpage,
} from "../service-instructions-email";
import { newSb } from "../../tests/session-builder";
import { AppTesterPal } from "../../tests/app-tester-pal";

const sb = newSb();

describe("ServiceInstructionsContent", () => {
  it("Does not explode", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <ServiceInstructionsContent {...ExampleServiceInstructionsProps} />
    );
    expect(html).toMatch(/serving the papers/i);
  });
});

test("<ExampleServiceInstructionsEmailForm> does not explode", () => {
  const pal = new AppTesterPal(<ExampleServiceInstructionsEmailForm />);
  pal.rr.getByText(/html email/i);
});

test("<ServiceInstructionsWebpage> does not explode", () => {
  const pal = new AppTesterPal(<ServiceInstructionsWebpage />);
  pal.rr.getByText(/how to serve your hp/i);
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
