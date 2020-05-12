import React from "react";
import ReactDOMServer from "react-dom/server";

import {
  ProgressiveEnhancementProps,
  ProgressiveEnhancement,
  SimpleProgressiveEnhancement,
  NoScriptFallback,
  useProgressiveEnhancement,
} from "../progressive-enhancement";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

const HorribleComponent = (): JSX.Element => {
  throw new Error("blaah");
};

describe("ProgressiveEnhancement", () => {
  let mockConsoleError: jest.SpyInstance;

  const props: ProgressiveEnhancementProps = {
    renderBaseline() {
      return <p>i am baseline</p>;
    },
    renderEnhanced() {
      return <p>i am enhanced</p>;
    },
  };

  beforeEach(() => {
    mockConsoleError = jest.spyOn(console, "error");
    mockConsoleError.mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  it("renders baseline version on server-side", () => {
    const html = ReactDOMServer.renderToString(
      <ProgressiveEnhancement {...props} />
    );
    expect(html).toMatch(/i am baseline/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("renders enhanced version on clients with JS", () => {
    const pal = new ReactTestingLibraryPal(
      <ProgressiveEnhancement {...props} />
    );
    pal.rr.getByText(/i am enhanced/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("renders baseline if enhanced version raises an error", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <ProgressiveEnhancement
          {...props}
          renderEnhanced={() => <HorribleComponent />}
        />
      )
    );
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("propagates error if enhancement is disabled and baseline throws", () => {
    expect(
      () =>
        new ReactTestingLibraryPal(
          (
            <ProgressiveEnhancement
              {...props}
              disabled
              renderBaseline={() => <HorribleComponent />}
            />
          )
        )
    ).toThrow(/blaah/);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("propagates error if both enhanced and baseline throw", () => {
    expect(
      () =>
        new ReactTestingLibraryPal(
          (
            <ProgressiveEnhancement
              {...props}
              renderEnhanced={() => <HorribleComponent />}
              renderBaseline={() => <HorribleComponent />}
            />
          )
        )
    ).toThrow(/blaah/);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("renders baseline if disabled is true", () => {
    const pal = new ReactTestingLibraryPal(
      <ProgressiveEnhancement {...props} disabled />
    );
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("falls back to baseline if enhanced version tells it to", () => {
    const err = new Error("oof");
    const pal = new ReactTestingLibraryPal(
      (
        <ProgressiveEnhancement
          {...props}
          renderEnhanced={(ctx) => {
            return (
              <button onClick={() => ctx.fallbackToBaseline(err)}>
                kaboom
              </button>
            );
          }}
        />
      )
    );
    pal.clickButtonOrLink("kaboom");
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Falling back to baseline implementation due to error: ",
      err
    );
  });
});

describe("SimpleProgressiveEnhancement", () => {
  it("renders children when enabled", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <SimpleProgressiveEnhancement>
          <span>i am enhanced</span>
        </SimpleProgressiveEnhancement>
      )
    );
    pal.rr.getByText(/i am enhanced/);
  });

  it("does not render children when disabled", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <SimpleProgressiveEnhancement disabled>
          <span>i am enhanced</span>
        </SimpleProgressiveEnhancement>
      )
    );
    expect(pal.rr.container.childElementCount).toBe(0);
  });
});

describe("NoScriptFallback", () => {
  const Component = () => (
    <NoScriptFallback>
      <span>i am fallback content</span>
    </NoScriptFallback>
  );

  it("renders nothing when mounted", () => {
    const pal = new ReactTestingLibraryPal(<Component />);
    expect(pal.rr.container.childElementCount).toBe(0);
  });

  it("renders fallback content on the server", () => {
    const html = ReactDOMServer.renderToString(<Component />);
    expect(html).toMatch(/i am fallback content/);
  });
});

describe("useProgressiveEnhancement", () => {
  function MyComponent() {
    const isMounted = useProgressiveEnhancement();
    return <p>{`isMounted is ${isMounted}`}</p>;
  }

  it("renders 'true' when mounted", () => {
    const pal = new ReactTestingLibraryPal(<MyComponent />);
    expect(pal.rr.container.textContent).toBe("isMounted is true");
  });

  it("renders 'false' on the server", () => {
    const html = ReactDOMServer.renderToString(<MyComponent />);
    expect(html).toMatch(/isMounted is false/);
  });
});
