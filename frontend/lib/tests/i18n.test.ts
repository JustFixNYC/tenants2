import i18n, { I18n } from "../i18n";

const UNINIT_RE = /i18n is not initialized/i;

describe('I18n', () => {
  it('raises exception on methods/properties if uninitialized', () => {
    const i18n = new I18n();
    expect(() => i18n.locale).toThrow(UNINIT_RE);
    expect(() => i18n.localePathPrefix).toThrow(UNINIT_RE);
  });

  it('returns whether it is initialized or not', () => {
    expect(new I18n('en').isInitialized).toBe(true);

    const i18n = new I18n();
    expect(i18n.isInitialized).toBe(false);
    i18n.initialize('en');
    expect(i18n.isInitialized).toBe(true);
  });

  it('raises an error if initialized twice', () => {
    expect(() => new I18n('en').initialize('es')).toThrow(/already initialized/i);
  });

  it('returns locale path prefixes', () => {
    expect(new I18n('').localePathPrefix).toBe('');
    expect(new I18n('en').localePathPrefix).toBe('/en');
  });
});
