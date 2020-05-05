/** @jest-environment node */

import { errorCatchingHandler } from "../lambda";
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
