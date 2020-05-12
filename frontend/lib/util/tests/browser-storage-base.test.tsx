import React from "react";
import ReactDOMServer from "react-dom/server";
import {
  BrowserStorage,
  createUseBrowserStorage,
  BaseBrowserStorageSchema,
} from "../browser-storage-base";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

class FakeStorage {
  constructor(readonly data: any = {}) {}

  setItem(key: string, value: any) {
    this.data[key] = value;
  }

  getItem(key: string): any {
    return this.data[key] ?? null;
  }
}

describe("BrowserStorage", () => {
  const captureConsoleWarn = (cb: () => void) => {
    const warn = jest.fn();
    const oldWarn = console.warn;
    console.warn = warn;
    try {
      cb();
    } finally {
      console.warn = oldWarn;
    }
    return warn;
  };

  it("works with functional storage backend", () => {
    const fs = new FakeStorage();
    const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", fs);
    expect(bs.get("boop")).toBe("hi");
    bs.update({ boop: "bleh" });
    expect(bs.get("boop")).toBe("bleh");
    expect(JSON.parse(fs.getItem("blarg")).boop).toBe("bleh");
  });

  it("works with non-functional storage backend", () => {
    const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", null);
    expect(bs.get("boop")).toBe("hi");
    bs.update({ boop: "bleh" });
    expect(bs.get("boop")).toBe("bleh");
  });

  it("can be cleared", () => {
    const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", null);
    bs.update({ boop: "bleh" });
    bs.clear();
    expect(bs.get("boop")).toBe("hi");
  });

  it("reads from storage backend if it has proper schema version", () => {
    const fs = new FakeStorage();
    fs.setItem("blarg", JSON.stringify({ _version: 2, boop: "huh" }));
    const bs = new BrowserStorage({ _version: 2, boop: "hi" }, "blarg", fs);
    expect(bs.get("boop")).toBe("huh");
  });

  it("notifies listeners of changes until they unsubscribe", () => {
    const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", null);
    let v: any;
    let counter = 0;
    const unsubscribe = bs.listenForChanges((value) => {
      v = value;
      counter++;
    });
    expect(v).toBe(undefined);
    expect(counter).toBe(0);

    for (let i = 0; i < 2; i++) {
      bs.update({ boop: "hi2" });
      expect(v.boop).toEqual("hi2");
      // The listener should only be called (and counter incremented) on
      // *changes* to the state, i.e. spurious updates don't count.
      expect(counter).toBe(1);
    }

    bs.update({ boop: "hi3" });
    expect(v.boop).toEqual("hi3");
    expect(counter).toBe(2);

    unsubscribe();

    bs.update({ boop: "hi4" });
    expect(v.boop).toEqual("hi3");
    expect(counter).toBe(2);
  });

  it("ignores storage backend value if schema version is wrong", () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem("blarg", JSON.stringify({ _version: 1, boop: "huh" }));
      const bs = new BrowserStorage({ _version: 2, boop: "hi" }, "blarg", fs);
      expect(bs.get("boop")).toBe("hi");
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe("Error deserializing BrowserStorage");
    expect(err.message).toBe("Stored schema is not version 2");
  });

  it("ignores storage backend exceptions on get", () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem("blarg", "boop");
      const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", fs);
      expect(bs.get("boop")).toBe("hi");
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe("Error deserializing BrowserStorage");
    expect(err.message).toMatch(/JSON/);
  });

  it("ignores storage backend exceptions on set", () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem = () => {
        throw new Error("BOOP");
      };
      const bs = new BrowserStorage({ _version: 1, boop: "hi" }, "blarg", fs);
      bs.update({ boop: "blargg" });
      expect(bs.get("boop")).toBe("blargg");
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe("Error serializing BrowserStorage");
    expect(err.message).toBe("BOOP");
  });
});

describe("createUseBrowserStorage", () => {
  type MySchema = BaseBrowserStorageSchema & {
    counter?: number;
  };
  const defaultStorage: MySchema = { _version: 1 };
  const fs = new FakeStorage();
  const bs = new BrowserStorage(defaultStorage, "oof", fs);
  const useBrowserStorage = createUseBrowserStorage(bs);

  const MyComponent: React.FC<{}> = () => {
    const [state, updateState] = useBrowserStorage();

    return (
      <>
        <p>{`counter is ${state.counter}`}</p>
        <button
          onClick={() =>
            updateState({
              counter: (state.counter || 0) + 1,
            })
          }
        >
          increment
        </button>
      </>
    );
  };

  beforeEach(() => bs.clear());

  it("works", () => {
    const pal = new ReactTestingLibraryPal(<MyComponent />);
    pal.rr.getByText("counter is undefined");
    expect(bs.get("counter")).toBe(undefined);
    pal.clickButtonOrLink("increment");
    pal.rr.getByText("counter is 1");
    expect(bs.get("counter")).toBe(1);
  });

  it("always renders w/ default storage value pre-mount", () => {
    bs.update({ counter: 5 });
    const html = ReactDOMServer.renderToString(<MyComponent />);
    expect(html).toMatch(/counter is undefined/);
  });

  it("renders w/ latest browser storage on mount", () => {
    bs.update({ counter: 5 });
    const pal = new ReactTestingLibraryPal(<MyComponent />);
    pal.rr.getByText("counter is 5");
  });
});
