import React, { useContext } from "react";

import { AppWithoutRouter, AppPropsWithRouter, App, AppProps } from "../app";
import {
  createTestGraphQlClient,
  FakeSessionInfo,
  FakeServerInfo,
} from "./util";
import ReactTestingLibraryPal from "./rtl-pal";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router";
import { defaultContext, AppContext } from "../app-context";

describe("App", () => {
  let appContext = defaultContext;

  const AppContextCapturer = () => {
    appContext = useContext(AppContext);
    return <p>HAI</p>;
  };

  const buildPal = (initialSession = FakeSessionInfo) => {
    const props: AppProps = {
      initialURL: "/",
      locale: "en",
      initialSession,
      server: FakeServerInfo,
      children: <AppContextCapturer />,
    };
    const pal = new ReactTestingLibraryPal(
      (
        <HelmetProvider>
          <MemoryRouter>
            <App {...props} />
          </MemoryRouter>
        </HelmetProvider>
      )
    );
    return pal;
  };

  

  it("notifies FullStory when user logs in", () => {
    const identify = jest.fn();
    window.FS = { identify };
    buildPal();
    expect(identify.mock.calls).toHaveLength(0);
    appContext.updateSession({
      userId: 1,
      firstName: "Boop",
    });
    expect(identify.mock.calls).toHaveLength(1);
    expect(identify.mock.calls).toEqual([
      ["user:1", { displayName: "Boop (#1)" }],
    ]);
  });

  it("notifies FullStory on mount if user is already logged in", () => {
    const identify = jest.fn();
    window.FS = { identify };
    buildPal({ ...FakeSessionInfo, userId: 5, firstName: "blah" });
    expect(identify.mock.calls).toHaveLength(1);
  });

  it("handles session updates", () => {
    buildPal();
    appContext.updateSession({ csrfToken: "blug" });
    expect(appContext.session.csrfToken).toBe("blug");
  });
});

describe("AppWithoutRouter", () => {
  const buildApp = (initialSession = FakeSessionInfo) => {
    const { client } = createTestGraphQlClient();
    const props: AppPropsWithRouter = {
      initialURL: "/",
      locale: "en",
      initialSession,
      server: FakeServerInfo,
      history: {} as any,
      location: {} as any,
      match: null as any,
    };

    const app = new AppWithoutRouter(props);

    app.gqlClient = client;
    return { client, app };
  };

  it("reports fetch errors", () => {
    const { app } = buildApp();

    const windowAlert = jest.fn();
    jest.spyOn(window, "alert").mockImplementation(windowAlert);
    const consoleError = jest.fn();
    jest.spyOn(console, "error").mockImplementation(consoleError);
    const err = new Error("blargghh");
    app.handleFetchError(err);
    expect(consoleError.mock.calls).toHaveLength(1);
    expect(consoleError.mock.calls[0][0]).toBe(err);
    expect(windowAlert.mock.calls).toHaveLength(1);
    expect(windowAlert.mock.calls[0][0]).toContain("network error");
  });

  it("tracks pathname changes in google analytics", () => {
    const { app } = buildApp();

    const mockGa = jest.fn();
    window.ga = mockGa;
    try {
      app.handlePathnameChange("/old", "", "/new", "", "PUSH");
      expect(mockGa.mock.calls).toHaveLength(2);
      expect(mockGa.mock.calls[0]).toEqual(["set", "page", "/new"]);
      expect(mockGa.mock.calls[1]).toEqual(["send", "pageview"]);
      mockGa.mockClear();

      // Ensure it doesn't track anything when the pathname doesn't change.
      app.handlePathnameChange("/new", "", "/new", "", "PUSH");
      expect(mockGa.mock.calls).toHaveLength(0);
    } finally {
      delete window.ga;
    }
  });

  describe("fetch()", () => {
    it("delegates to GraphQL client fetch", async () => {
      const { app, client } = buildApp();
      const promise = app.fetch("bleh", "vars");
      const request = client.getRequestQueue()[0];

      expect(request.query).toBe("bleh");
      expect(request.variables).toBe("vars");
      request.resolve("response");
      expect(await promise).toBe("response");
    });

    it("calls handleFetchError() on exceptions", async () => {
      const { app, client } = buildApp();
      const handleErr = (app.handleFetchError = jest.fn());
      const promise = app.fetch("bleh", "vars");
      const err = new Error("alas");

      client.getRequestQueue()[0].reject(err);
      try {
        await promise;
      } catch (e) {}

      expect(promise).rejects.toBe(err);
      expect(handleErr.mock.calls).toEqual([[err]]);
    });
  });
});
