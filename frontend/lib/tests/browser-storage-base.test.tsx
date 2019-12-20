import { BrowserStorage } from "../browser-storage-base";

class FakeStorage {
  constructor(readonly data: any = {}) {
  }

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
  }

  it("works with functional storage backend", () => {
    const fs = new FakeStorage();
    const bs = new BrowserStorage({_version: 1, boop: "hi"}, 'blarg', fs);
    expect(bs.get('boop')).toBe('hi');
    bs.update({boop: 'bleh'});
    expect(bs.get('boop')).toBe('bleh');
    expect(JSON.parse(fs.getItem('blarg')).boop).toBe('bleh');
  });

  it("works with non-functional storage backend", () => {
    const bs = new BrowserStorage({_version: 1, boop: "hi"}, 'blarg', null);
    expect(bs.get('boop')).toBe('hi');
    bs.update({boop: 'bleh'});
    expect(bs.get('boop')).toBe('bleh');
  });

  it("can be cleared", () => {
    const bs = new BrowserStorage({_version: 1, boop: "hi"}, 'blarg', null);
    bs.update({boop: 'bleh'});
    bs.clear();
    expect(bs.get('boop')).toBe('hi');
  });

  it('reads from storage backend if it has proper schema version', () => {
    const fs = new FakeStorage();
    fs.setItem('blarg', JSON.stringify({_version: 2, boop: 'huh'}));
    const bs = new BrowserStorage({_version: 2, boop: "hi"}, 'blarg', fs);
    expect(bs.get('boop')).toBe('huh');
  });

  it('ignores storage backend value if schema version is wrong', () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem('blarg', JSON.stringify({_version: 1, boop: 'huh'}));
      const bs = new BrowserStorage({_version: 2, boop: "hi"}, 'blarg', fs);
      expect(bs.get('boop')).toBe('hi');
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe('Error deserializing BrowserStorage');
    expect(err.message).toBe('Stored schema is not version 2');
  });

  it('ignores storage backend exceptions on get', () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem('blarg', 'boop');
      const bs = new BrowserStorage({_version: 1, boop: "hi"}, 'blarg', fs);
      expect(bs.get('boop')).toBe('hi');
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe('Error deserializing BrowserStorage');
    expect(err.message).toMatch(/JSON/);
  });

  it('ignores storage backend exceptions on set', () => {
    const warn = captureConsoleWarn(() => {
      const fs = new FakeStorage();
      fs.setItem = () => { throw new Error("BOOP"); };
      const bs = new BrowserStorage({_version: 1, boop: "hi"}, 'blarg', fs);
      bs.update({boop: 'blargg'});
      expect(bs.get('boop')).toBe('blargg');
    });
    const [[msg, err]] = warn.mock.calls;
    expect(msg).toBe('Error serializing BrowserStorage');
    expect(err.message).toBe("BOOP");
  });
});
