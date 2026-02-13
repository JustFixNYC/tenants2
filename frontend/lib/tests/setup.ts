import { defaultContext } from "../app-context";
import { FakeAppContext, overrideGlobalAppServerInfo } from "./util";
import chalk from "chalk";
import "../ui/tests/confetti.setup";
import i18n from "../i18n";
import { setFriendlyLoadMs } from "../networking/loading-page";
import { setSupportPreloadedCatalogs } from "../i18n-lingui";

i18n.initialize("en");
overrideGlobalAppServerInfo();
setFriendlyLoadMs(1);
setSupportPreloadedCatalogs(true);

Object.keys(FakeAppContext).forEach((prop) => {
  Object.defineProperty(defaultContext, prop, {
    value: (FakeAppContext as any)[prop],
  });
});

if (typeof window !== "undefined") {
  // react-aria-modal seems to call this, but jsdom
  // doesn't support it, and throws an exception when
  // it's called. So we'll just stub it out.
  window.scroll = jest.fn();
  window.scrollTo = jest.fn();
}

const originalLog = console.log;

/* istanbul ignore next */
/**
 * Apparently jest sometimes doesn't log stuff to the console, which is
 * AWESOME. So here we'll force some newlines and things to hopefully
 * increase the chance that Jest will actually output something to the
 * console in time for the user to see it.
 *
 * Apparently this is a long-standing problem for some people:
 *
 *   https://github.com/facebook/jest/issues/3853
 *
 * Combined with the general sluggishness of Jest on Windows, I'm
 * very much regretting not using Mocha at this point.
 */
console.log = function (message?: any, ...optionalParams: any[]) {
  originalLog.apply(this, [message, ...optionalParams]);
  originalLog.call(this, chalk.green("\n ^^^ SOMETHING GOT LOGGED! ^^^\n"));
};

(global as any).DISABLE_WEBPACK_ANALYZER = false;
