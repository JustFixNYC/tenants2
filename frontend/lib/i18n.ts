class I18n {
  private _locale: null|string = null;

  private raiseInitError(): never {
    throw new Error('i18n is not initialized!');
  }

  get locale(): string {
    if (this._locale === null) return this.raiseInitError();
    return this._locale;
  }

  initialize(locale: string) {
    if (this._locale !== null) {
      throw new Error('i18n is already initialized!');
    }
    this._locale = locale;
  }

  resetForTesting(): void {
    this._locale = null;
  }
}

const i18n = new I18n();

export default i18n;
