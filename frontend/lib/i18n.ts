/**
 * A locale we currently support (either fully or partially), as
 * an ISO 639-1 code.
 */
export type SupportedLocale = "en" | "es";

export const allSupportedLocales: SupportedLocale[] = ["en", "es"];

/**
 * This class keeps track of internationalization-related data.
 *
 * Instances start out uninitialized, and must be explicitly
 * initialized before any other methods or properties can be
 * accessed.
 *
 * Once initialized, an instance can actually be re-initialized;
 * clients can register to be notified if and when this happens.
 */
export class I18n {
  private _locale: null | SupportedLocale = null;
  private _changeListeners: Function[] = [];

  /**
   * Create an instance, optionally auto-initializing it.
   *
   * @param locale An ISO 639-1 code such as 'en' or 'es'.
   */
  constructor(locale?: SupportedLocale) {
    if (typeof locale === "string") {
      this.initialize(locale);
    }
  }

  private raiseInitError(): never {
    throw new Error("i18n is not initialized!");
  }

  /**
   * Return the current locale, raising an error if the
   * class is uninitialized.
   */
  get locale(): SupportedLocale {
    if (this._locale === null) return this.raiseInitError();
    return this._locale;
  }

  /**
   * Return the URL path prefix for the current locale.
   * This will be a slash followed by the locale's ISO 639-1 code,
   * e.g. '/en'.
   */
  get localePathPrefix(): string {
    return `/${this.locale}`;
  }

  /**
   * Initialize the instance to the given locale.
   *
   * @param locale An ISO 639-1 code such as 'en' or 'es'.
   */
  initialize(locale: SupportedLocale) {
    this._locale = locale;
    this._changeListeners.forEach((cb) => cb());

    // We used to support having the locale be an empty string to
    // disable localization, but removed support for it; just to
    // make sure we don't have any code that still thinks we support
    // it, we'll make an assertion here.
    if (!locale) {
      throw new Error("Assertion failure, locale must be a non-empty string!");
    }
  }

  /** Return whether the instance is initialized. */
  get isInitialized(): boolean {
    return this._locale !== null;
  }

  /**
   * Register a listener to be notified when the instance
   * is initialized or re-initialized.
   */
  addChangeListener(cb: Function) {
    this._changeListeners.push(cb);
  }

  /** Unregister a previously-registered listener. */
  removeChangeListener(cb: Function) {
    const index = this._changeListeners.indexOf(cb);
    if (index === -1) {
      throw new Error("change listener does not exist!");
    }
    this._changeListeners.splice(index, 1);
  }
}

/**
 * This is a global singleton for the JS runtime. It's largely
 * a singleton because passing it around everywhere would be
 * a massive headache, especially given the state of the codebase
 * at the time that internationalization was introduced.
 *
 * That said, one should prefer to write client code in a way
 * such that an I18n object is passed into it, rather than
 * grabbing this singleton directly. This will make it easier
 * to unit test, as well as to eventually get rid of the global
 * singleton altogether.
 */
const i18n = new I18n();

export default i18n;
