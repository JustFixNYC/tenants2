import { act } from "react-dom/test-utils";
import { render, unmountComponentAtNode } from "react-dom";
import React from "react";

import { useEffect } from "react";
import { LinguiI18nProps, li18n } from "../i18n-lingui";
import { I18nProvider } from "@lingui/react";
import i18n from "../i18n";

const RenderChild: React.FC<{ onMount: Function }> = ({ onMount }) => {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return null;
};

function preloadComponent(
  Component: React.ComponentType<{ children: React.ReactNode }>
): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const cleanup = () => {
      unmountComponentAtNode(container);
      container.remove();
      resolve();
    };
    const handleMount = () => {
      setTimeout(cleanup, 0);
    };

    act(() => {
      render(
        <Component>
          <RenderChild onMount={handleMount} />
        </Component>,
        container
      );
    });
  });
}

/**
 * Preload a loadable Lingui catalog component so tests that need it
 * don't have to wait for it to load. This should generally be used in
 * a top-level `beforeAll()` in a test suite.
 */
export const preloadLingui = (
  Component: React.ComponentType<LinguiI18nProps>
) => () => preloadComponent(Component);

/**
 * A Lingui <I18nProvider> that provides any catalogs that have been
 * preloaded via `preloadLingui()`.
 */
export const PreloadedLinguiI18nProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const locale = i18n.locale;

  return (
    <I18nProvider language={locale} i18n={li18n}>
      {props.children}
    </I18nProvider>
  );
};
