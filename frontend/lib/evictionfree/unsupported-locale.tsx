import { Route } from "react-router-dom";
import React from "react";
import {
  EvictionFreeUnsupportedLocaleChoice,
  EvictionFreeUnsupportedLocaleChoices,
} from "../../../common-data/evictionfree-unsupported-locale-choices";
import { EvictionFreeRoutes } from "./route-info";
import Page from "../ui/page";

const LocalePage: React.FC<{ title: string; children: JSX.Element }> = (
  props
) => (
  <Page title={props.title} withHeading className="content">
    {props.children}
  </Page>
);

const LOCALE_PAGES: {
  [key in EvictionFreeUnsupportedLocaleChoice]: JSX.Element;
} = {
  ht: (
    <LocalePage title="TODO: Implement Haitian Creole page">
      <p>TODO add Haitian Creole content here!</p>
    </LocalePage>
  ),
};

const UnsupportedLocalePage: React.FC<{
  locale: EvictionFreeUnsupportedLocaleChoice;
}> = ({ locale }) => LOCALE_PAGES[locale];

export function createEvictionFreeUnsupportedLocaleRoutes(): JSX.Element[] {
  return EvictionFreeUnsupportedLocaleChoices.map((locale) => {
    return (
      <Route
        key={`unsupported_locale_${locale}`}
        path={EvictionFreeRoutes.unsupportedLocale[locale]}
        render={() => <UnsupportedLocalePage locale={locale} />}
      />
    );
  });
}
