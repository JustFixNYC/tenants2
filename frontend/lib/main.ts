/// <reference path="main-globals.d.ts" />

import "../vendor/raf";

import { startApp, AppProps } from "./app";
import { getHTMLElement } from "@justfixnyc/util";
import { ga } from "./analytics/google-analytics";
import i18n from "./i18n";
import { setGlobalAppServerInfo } from "./app-context";

function polyfillSmoothScroll() {
  if (
    document.documentElement &&
    !("scrollBehavior" in document.documentElement.style)
  ) {
    import(
      /* webpackChunkName: "smoothscroll-polyfill" */ "smoothscroll-polyfill"
    ).then((smoothscroll) => smoothscroll.polyfill());
  }
}

function showSafeModeUiOnShake() {
  if (!("ondevicemotion" in window)) return;

  import(/* webpackChunkName: "shake" */ "../vendor/shake").then((exports) => {
    const Shake = exports.default;

    new Shake({ threshold: 15, timeout: 1000 }).start();

    window.addEventListener(
      "shake",
      () => {
        ga("send", "event", "motion", "shake");
        window.SafeMode.showUI();
      },
      false
    );
  });
}

function init() {
  const div = getHTMLElement("div", "#main");
  const initialPropsEl = getHTMLElement("script", "#initial-props");
  if (!initialPropsEl.textContent) {
    throw new Error("Assertion failure, #initial-props must contain text");
  }
  const initialProps = JSON.parse(initialPropsEl.textContent) as AppProps;

  // See main-globals.d.ts for more details on this.
  __webpack_public_path__ = initialProps.server.webpackPublicPathURL;

  // It's possible that the server-side has made our main div
  // hidden because a pre-rendered modal is intended to contain
  // all keyboard-focusable elements in case JS couldn't be loaded.
  // Since JS is now loaded, let's remove that restriction.
  div.removeAttribute("hidden");

  i18n.initialize(initialProps.locale);
  setGlobalAppServerInfo(initialProps.server);
  startApp(div, initialProps);
  polyfillSmoothScroll();
  showSafeModeUiOnShake();
}

if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  init();
} else {
  window.addEventListener("DOMContentLoaded", init);
}

if (process.env.NODE_ENV !== "production" && DISABLE_DEV_SOURCE_MAPS) {
  console.log(
    "Source maps have been disabled to improve compilation speed. To " +
      "prevent this, unset the DISABLE_DEV_SOURCE_MAPS " +
      "environment variable."
  );
}
