import React from "react";
import {
  RedirectToEnglishPage,
  RedirectCurrentPathToEnglishPage,
  isLocaleSupported,
  PLRoute,
} from "../redirect-to-english-page";
import { AppTesterPal } from "../../tests/app-tester-pal";
import i18n, { SupportedLocale } from "../../i18n";
import { Switch, Route } from "react-router-dom";

describe("RedirectToEnglishPage", () => {
  it("works", () => {
    const pal = new AppTesterPal(<RedirectToEnglishPage to="/blah" />);
    pal.ensureLinkGoesTo(/take me there/i, "/blah");
  });
});

describe("RedirectCurrentPathToEnglishPage", () => {
  it("raises exception when path is not locale-prefixed", () => {
    const props = { location: { pathname: "/blah" } } as any;
    expect(() => RedirectCurrentPathToEnglishPage(props)).toThrow(
      "Path /blah is not locale-prefixed!"
    );
  });
});

test("isLocaleSupported() works", () => {
  i18n.initialize("en");
  expect(isLocaleSupported({ enableWipLocales: false })).toBe(true);
  expect(isLocaleSupported({ locales: ["es"], enableWipLocales: false })).toBe(
    false
  );

  i18n.initialize("es");
  expect(
    isLocaleSupported({ locales: ["en", "es"], enableWipLocales: false })
  ).toBe(true);
  expect(
    isLocaleSupported({ wipLocales: ["es"], enableWipLocales: false })
  ).toBe(false);
  expect(
    isLocaleSupported({ wipLocales: ["es"], enableWipLocales: true })
  ).toBe(true);
});

describe("<PLRoute>", () => {
  const makePal = (
    locale: SupportedLocale,
    enableWipLocales: boolean = false
  ) => {
    i18n.initialize(locale);
    const url = `${i18n.localePathPrefix}/boop`;
    return new AppTesterPal(
      (
        <Switch>
          <PLRoute
            wipLocales={["es"]}
            path={url}
            render={(p) => <p>I am {p.location.pathname}</p>}
          />
          <Route render={() => <p>I should never be shown</p>} />
        </Switch>
      ),
      {
        url,
        server: {
          enableWipLocales,
        },
      }
    );
  };

  it("shows source page in English", () => {
    const pal = makePal("en");
    pal.rr.getByText("I am /en/boop");
  });

  it("shows RedirectToEnglishPage in Spanish", () => {
    const pal = makePal("es");
    pal.rr.getByText(/only available in English/);
    const a = pal.rr.getByText(/take me there/) as HTMLAnchorElement;
    expect(a).toBeInstanceOf(HTMLAnchorElement);
    expect(a.getAttribute("href")).toBe("/en/boop");
  });

  it("shows source page in Spanish when enableWipLocales is set", () => {
    const pal = makePal("es", true);
    pal.rr.getByText("I am /es/boop");
  });
});
