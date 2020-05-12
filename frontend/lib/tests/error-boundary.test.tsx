import React from "react";

import { getErrorString, ErrorBoundary } from "../error-boundary";
import ReactTestingLibraryPal from "./rtl-pal";
import { HelmetProvider } from "react-helmet-async";

const ERR_MSG = "KABOOOOOM";

function KaboomComponent(props: { throwError: boolean }) {
  if (props.throwError) {
    throw new Error(ERR_MSG);
  }

  return null;
}

test("getErrorString() works", () => {
  expect(getErrorString(null)).toBe("Unknown error");
  expect(getErrorString({ stack: "bleh" })).toBe("bleh");
  expect(
    getErrorString({
      toString() {
        return "boop";
      },
    })
  ).toBe("boop");
  expect(
    getErrorString({
      toString() {
        throw new Error();
      },
    })
  ).toBe("Unknown error");
});

describe("ErrorBoundary", () => {
  const simulateError = (props: { debug: boolean }) => {
    const oldError = window.console.error;

    window.console.error = (...args: any[]) => {
      const firstArg = args[0];
      if (
        typeof firstArg === "string" &&
        (firstArg.includes(ERR_MSG) || firstArg.includes(KaboomComponent.name))
      ) {
        return;
      }
      oldError(...args);
    };

    const pal = new ReactTestingLibraryPal(
      (
        <HelmetProvider>
          <ErrorBoundary {...props}>
            <KaboomComponent throwError />
          </ErrorBoundary>
        </HelmetProvider>
      )
    );

    window.console.error = oldError;

    return pal.rr.baseElement.innerHTML;
  };

  it("renders children", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <ErrorBoundary debug={false}>
          <p>hi</p>
        </ErrorBoundary>
      )
    );
    pal.rr.getByText("hi");
  });

  it("shows error details when debug is true", () => {
    const html = simulateError({ debug: true });
    expect(html).toContain(ERR_MSG);
    expect(html).toContain(KaboomComponent.name);
  });

  it("does not show error details when debug is false", () => {
    const html = simulateError({ debug: false });
    expect(html).not.toContain(ERR_MSG);
    expect(html).not.toContain(KaboomComponent.name);
  });
});
