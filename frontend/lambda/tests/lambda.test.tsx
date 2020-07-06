/** @jest-environment node */

import React from "react";
import { errorCatchingHandler, generateLambdaResponse } from "../lambda";
import { AppProps } from "../../lib/app";
import { FakeServerInfo, FakeSessionInfo } from "../../lib/tests/util";

const fakeAppProps: AppProps = {
  initialURL: "/en/",
  locale: "en",
  server: FakeServerInfo,
  initialSession: FakeSessionInfo,
};

test("lambda works", async () => {
  jest.setTimeout(10000);
  const response = await errorCatchingHandler(fakeAppProps);
  expect(response.status).toBe(200);
  expect(response.location).toBeNull();
});

describe("generateLambdaResponse()", () => {
  const fakeHelmet = (h: any) => {
    h.helmet = {
      title: "<title>fake title</title>",
      meta: "",
    };
  };

  it("inlines HTML when needed", () => {
    let shouldInlineCss = false;
    const UNINLINED_HTML = "<style>p { color: pink; }</style><p>hi</p>";
    const generate = () =>
      generateLambdaResponse(
        fakeAppProps,
        (_, ctx, __, h) => {
          fakeHelmet(h);
          ctx.staticContent = <></>;
          ctx.shouldInlineCss = shouldInlineCss;
          return "";
        },
        () => UNINLINED_HTML
      );

    expect(generate().html).toBe(UNINLINED_HTML);
    shouldInlineCss = true;
    expect(generate().html).toBe('<p style="color: pink;">hi</p>');
  });
});

test("lambda redirects", async () => {
  const response = await errorCatchingHandler({
    ...fakeAppProps,
    initialURL: "/dev/examples/redirect",
  });
  expect(response.status).toBe(302);
  expect(response.location).toBe("/en/");
});

test("lambda catches errors", async () => {
  const response = await errorCatchingHandler({
    ...fakeAppProps,
    testInternalServerError: true,
  });
  expect(response.status).toBe(500);
  expect(response.traceback).toMatch(/Testing internal server error/i);
  expect(response.traceback).toMatch(/lambda\.tsx/);
});
