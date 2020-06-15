import React from "react";
import {
  LocalizedOutboundLinkProps,
  LocalizedOutboundLink,
  LocalizedOutboundLinkList,
} from "../localized-outbound-link";
import { Trans } from "@lingui/macro";
import i18n from "../../i18n";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { LinguiI18n } from "../../i18n-lingui";
import { waitFor } from "@testing-library/dom";
import { LocaleChoice } from "../../../../common-data/locale-choices";

const HELLO_WORLD_LINK: LocalizedOutboundLinkProps = {
  children: <Trans>Hello world</Trans>,
  hrefs: {
    en: "http://english.example.com/",
    es: "http://spanish.example.com/",
  },
};

function renderLink(
  locale: LocaleChoice,
  props: LocalizedOutboundLinkProps = HELLO_WORLD_LINK
): Promise<HTMLAnchorElement> {
  i18n.initialize(locale);
  const pal = new ReactTestingLibraryPal(
    (
      <LinguiI18n>
        <LocalizedOutboundLink {...props} />
      </LinguiI18n>
    )
  );

  return waitFor(() => pal.getElement("a") as HTMLAnchorElement);
}

describe("<LocalizedOutboundLink>", () => {
  it("works in English", async () => {
    const a = await renderLink("en");
    expect(a.textContent).toBe("Hello world");
    expect(a.href).toBe("http://english.example.com/");
  });

  it("works in Spanish", async () => {
    const a = await renderLink("es");
    expect(a.textContent).toBe("Hola mundo");
    expect(a.href).toBe("http://spanish.example.com/");
  });
});

test("<LocalizedOutboundLinkList> does not explode", () => {
  LocalizedOutboundLinkList({ links: [HELLO_WORLD_LINK] });
});
