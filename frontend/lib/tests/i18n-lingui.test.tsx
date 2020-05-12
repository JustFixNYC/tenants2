import React from "react";
import i18n from "../i18n";
import ReactTestingLibraryPal from "./rtl-pal";
import { LinguiI18n, li18n } from "../i18n-lingui";
import { Trans, t } from "@lingui/macro";
import { waitFor } from "@testing-library/react";
import { getUSStateChoiceLabels } from "../../../common-data/us-state-choices";

describe("<LinguiI18n>", () => {
  const linguified = (el: JSX.Element) => <LinguiI18n>{el}</LinguiI18n>;

  const helloWorldJSX = linguified(<Trans>Hello world</Trans>);

  it("Works in English", async () => {
    i18n.initialize("en");
    const pal = new ReactTestingLibraryPal(helloWorldJSX);
    await waitFor(() => pal.rr.getByText("Hello world"));
    expect(li18n.language).toBe("en");
    expect(li18n._(t`Hello world`)).toBe("Hello world");
  });

  it("works in Spanish", async () => {
    i18n.initialize("es");
    const pal = new ReactTestingLibraryPal(helloWorldJSX);
    await waitFor(() => pal.rr.getByText("Hola mundo"));
    expect(li18n.language).toBe("es");
    expect(li18n._(t`Hello world`)).toBe("Hola mundo");
  });

  it("localizes commondatabuilder choices", async () => {
    i18n.initialize("es");
    const NewMexico = () => <p>{getUSStateChoiceLabels()["NM"]}</p>;
    const pal = new ReactTestingLibraryPal(linguified(<NewMexico />));
    await waitFor(() => pal.rr.getByText("Nuevo México"));
  });
});
