// @ts-check

/**
 * This file contains ES3-compliant JavaScript that will be minified and inserted
 * into the top of the page as an inline snippet. Its purpose is to listen for any
 * uncaught errors that are raised on the page and present a UI to opt the user
 * into "safe mode" (also known as "compatibility mode"), whereby we deliver
 * nearly zero JavaScript to the client browser.
 */
(function () {
  /**
   * The amount of time from when we receive an error to when we show the
   * opt-in UI for activating safe mode.
   *
   * The reason there is any delay is because in some cases, an error
   * event occurs and our own client-side code later deals with it
   * gracefully on its own, obviating the need for the user to enter
   * safe mode. We need to provide some leeway for that code to
   * let us know that the error has been handled, hence this delay.
   */
  var SHOW_UI_DELAY_MS = 250;

  /**
   * The amount of time we'll wait for the application on this
   * page to let us know it's ready before we show the safe
   * mode UI. This is essentially a fail-safe mechanism.
   */
  var APP_READY_TIMEOUT_MS = 10000;

  /**
   * The data attribute we're using to determine whether the
   * safe mode opt-in UI is hidden or not. We're not using the
   * standard 'hidden' attribute because under some situations,
   * e.g. if JS in the client browser is completely disabled or
   * this script fails to run, we actually want the UI to be
   * visible even if it has this attribute, and we don't want
   * e.g. assistive technologies to hide the element just because
   * it has the 'hidden' attribute.
   */
  var HIDDEN_ATTR = "data-safe-mode-hidden";

  /**
   * A list of error messages that other client-side code has told
   * us to ignore.
   *
   * @type {string[]}
   */
  var errorsToIgnore = [];

  /**
   * A list of error messages that we've received so far.
   *
   * @type {string[]}
   */
  var errors = [];

  /**
   * Book-keeping used to control the display of the UI.
   *
   * @type {number|null}
   */
  var showUiTimeout = null;

  /**
   * If the app doesn't tell us it's ready within a certain
   * amount of time, we will throw an error (thereby triggering
   * the display of safe mode) as a fail-safe.
   *
   * @type {number}
   */
  var appReadyTimeout = window.setTimeout(function () {
    throw new Error(
      "SafeMode.appIsReady() was not called within " +
        APP_READY_TIMEOUT_MS +
        " ms."
    );
  }, APP_READY_TIMEOUT_MS);

  /**
   * Check to see if any valid errors have been logged and return
   * true if so.
   *
   * @returns {boolean}
   */
  function validErrorsExist() {
    for (var i = 0; i < errors.length; i++) {
      if (errorsToIgnore.indexOf(errors[i]) === -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Configure the opt-in UI to close itself when its close button is clicked.
   *
   * @param {HTMLElement} el The HTML element for the opt-in UI.
   */
  function setupUICloseButton(el) {
    /** @type {HTMLButtonElement|null} */
    var closeBtn = el.querySelector("button.delete");

    if (closeBtn) {
      // We may be called multiple times on the same
      // element over time, but it should only be triggered once
      // when clicked, so we'll bind by setting onclick rather than
      // via addEventListener().
      closeBtn.onclick = function () {
        if (el) {
          el.setAttribute(HIDDEN_ATTR, "");
        }
        if (window.ga) {
          window.ga("send", "event", "safe-mode", "hide");
        }
      };
    }
  }

  /** Shedule a check to see if we should display the opt-in UI. */
  function scheduleShowUICheck() {
    if (showUiTimeout !== null) {
      window.clearTimeout(showUiTimeout);
      showUiTimeout = null;
    }
    showUiTimeout = window.setTimeout(function () {
      var el = document.getElementById("safe-mode-enable");

      showUiTimeout = null;

      if (el && el.hasAttribute(HIDDEN_ATTR) && validErrorsExist()) {
        el.removeAttribute(HIDDEN_ATTR);
        el.focus();

        if (window.ga) {
          window.ga("send", "event", "safe-mode", "show");
        }

        setupUICloseButton(el);
      }

      errors = [];
      errorsToIgnore = [];
    }, SHOW_UI_DELAY_MS);
  }

  /**
   * Record the given error and show the safe mode opt-in API
   * if needed.
   *
   * @param err {Error}
   */
  function reportError(err) {
    try {
      errors.push(err.toString());
    } catch (e) {
      errors.push("unknown error");
    }
    scheduleShowUICheck();
  }

  /** Our public API. See safe-mode-globals.d.ts for more documentation. */
  window.SafeMode = {
    showUI: function () {
      errors.push("showUI() called");
      scheduleShowUICheck();
    },
    reportError: reportError,
    ignoreError: function (e) {
      errorsToIgnore.push(e.toString());
    },
    appIsReady: function () {
      clearTimeout(appReadyTimeout);
    },
  };

  /** Listen for any error events and report them. */
  window.addEventListener("error", function (e) {
    reportError(e.error);
  });

  /**
   * It's possible that some errors occurred while our page
   * was loading, but the opt-in UI wasn't available yet.
   * If that was the case, schedule another check to display
   * the UI just in case.
   */
  window.addEventListener("load", scheduleShowUICheck);

  var htmlEl = document.getElementsByTagName("html")[0];
  htmlEl.removeAttribute("data-safe-mode-no-js");

  /*
   * This isn't specifically related to safe mode per se, but
   * we want to remove the annoying grey highlight from iOS
   * taps, but doing this means running a teensy bit of JS
   * to enable our :active styles too. It's nice to have it
   * happen ASAP so we'll just do it here, since this snippet
   * loads very early during page load.
   *
   * For more details, see:
   * https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
   */
  document.addEventListener("touchstart", function () {}, true);
})();
