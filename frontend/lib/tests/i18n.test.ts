import { I18n } from "../i18n";

const UNINIT_RE = /i18n is not initialized/i;

describe("I18n", () => {
  it("raises exception on methods/properties if uninitialized", () => {
    const i18n = new I18n();
    expect(() => i18n.locale).toThrow(UNINIT_RE);
    expect(() => i18n.localePathPrefix).toThrow(UNINIT_RE);
  });

  it("returns whether it is initialized or not", () => {
    expect(new I18n("en").isInitialized).toBe(true);

    const i18n = new I18n();
    expect(i18n.isInitialized).toBe(false);
    i18n.initialize("en");
    expect(i18n.isInitialized).toBe(true);
  });

  it("raises error if nonexistent listener is removed", () => {
    expect(() => new I18n().removeChangeListener(() => {})).toThrow(
      /change listener does not exist/i
    );
  });

  it("notifies listeners on initialization", () => {
    let calls = 0;
    const i18n = new I18n();
    const cb = () => calls++;
    i18n.addChangeListener(cb);
    expect(calls).toBe(0);
    i18n.initialize("en");
    expect(calls).toBe(1);
    i18n.initialize("es");
    expect(calls).toBe(2);
    i18n.removeChangeListener(cb);
    i18n.initialize("en");
    expect(calls).toBe(2);
  });

  it("returns locale path prefixes", () => {
    expect(new I18n("en").localePathPrefix).toBe("/en");
    expect(new I18n("es").localePathPrefix).toBe("/es");
  });
});
