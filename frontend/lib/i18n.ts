export class I18n {
  private _locale: null|string = null;

  private raiseInitError(): never {
    throw new Error('i18n is not initialized!');
  }

  get locale(): string {
    if (this._locale === null) return this.raiseInitError();
    return this._locale;
  }

  get localePathPrefix(): string {
    const { locale } = this;
    return locale === '' ? '' : `/${locale}`;
  }

  initialize(locale: string) {
    if (this._locale !== null) {
      throw new Error('i18n is already initialized!');
    }
    this._locale = locale;
  }

  get isInitialized(): boolean {
    return this._locale !== null;
  }

  resetForTesting(): void {
    this._locale = null;
  }
}

const i18n = new I18n();

export default i18n;
