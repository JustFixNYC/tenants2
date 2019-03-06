/**
 * This class keeps track of internationalization-related data.
 * 
 * Instances start out uninitialized, and must be explicitly
 * initialized before any other methods or properties can be
 * accessed.
 */
export class I18n {
  private _locale: null|string = null;

  private raiseInitError(): never {
    throw new Error('i18n is not initialized!');
  }

  /**
   * Return the current locale, raising an error if the
   * class is uninitialized.
   * 
   * If the locale is set to the empty string, it means that
   * localization is currently disabled. Otherwise, the
   * string will be an ISO 639-1 code such as 'en' or 'es'.
   */
  get locale(): string {
    if (this._locale === null) return this.raiseInitError();
    return this._locale;
  }

  /**
   * Return the URL path prefix for the current locale.
   * If localization is disabled, this will be the
   * empty string; otherwise, it will be a slash followed
   * by the locale's ISO 639-1 code, e.g. '/en'.
   */
  get localePathPrefix(): string {
    const { locale } = this;
    return locale === '' ? '' : `/${locale}`;
  }

  /**
   * Initialize the instance to the given locale. Pass
   * an empty string to indicate that localization is
   * disabled, or an ISO 639-1 code such as 'en' or 'es'.
   */
  initialize(locale: string) {
    if (this._locale !== null) {
      throw new Error('i18n is already initialized!');
    }
    this._locale = locale;
  }

  /** Return whether the instance is initialized. */
  get isInitialized(): boolean {
    return this._locale !== null;
  }

  /**
   * Reset the instance, reverting it to an uninitialized
   * state.
   * 
   * As the name implies, this should ONLY be used for testing.
   */
  resetForTesting(): void {
    this._locale = null;
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
 * singleton.
 */
const i18n = new I18n();

export default i18n;
