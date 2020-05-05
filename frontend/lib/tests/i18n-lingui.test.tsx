import React from "react";
import i18n from "../i18n";
import ReactTestingLibraryPal from "./rtl-pal";
import { LinguiI18n, li18n } from "../i18n-lingui";
import { Trans, t } from "@lingui/macro";
import { wait } from "@testing-library/react";

describe("<LinguiI18n>", () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  const helloWorldJSX = (
    <LinguiI18n>
      <Trans>Hello world</Trans>
    </LinguiI18n>
  );

  it("defaults to 'en' when no locale is defined", async () => {
    i18n.initialize("");
    const pal = new ReactTestingLibraryPal(helloWorldJSX);
    await wait(() => pal.rr.getByText("Hello world"));
    expect(li18n.language).toBe("en");
    expect(li18n._(t`Hello world`)).toBe("Hello world");
  });

  it("works in Spanish", async () => {
    i18n.initialize("es");
    const pal = new ReactTestingLibraryPal(helloWorldJSX);
    await wait(() => pal.rr.getByText("Hola mundo"));
    expect(li18n.language).toBe("es");
    expect(li18n._(t`Hello world`)).toBe("Hola mundo");
  });
});
