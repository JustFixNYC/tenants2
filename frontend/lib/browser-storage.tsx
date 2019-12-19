import { useEffect } from "react";

const SCHEMA_VERSION = 1;

const SESSION_STORAGE_KEY = `tenants2_v${SCHEMA_VERSION}`;

type BrowserStorageSchema = {
  _version: number,
  latestAddress?: string,
  latestBorough?: string,
};

const DEFAULT_BROWSER_STORAGE: BrowserStorageSchema = {
  _version: SCHEMA_VERSION,
};

class BrowserStorage {
  private _cachedValue?: BrowserStorageSchema;

  private logWarning(msg: string, e: Error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${msg} ${this.constructor.name}`, e);
    }
  }

  private deserializeAndValidateCachedValue(): BrowserStorageSchema {
    try {
      let value = window.sessionStorage && window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (value) {
        let obj = JSON.parse(value) as BrowserStorageSchema;
        if (obj && obj._version === SCHEMA_VERSION) {
          return obj;
        }
      }
    } catch (e) {
      this.logWarning('Error deserializing', e);
    }
    return DEFAULT_BROWSER_STORAGE;
  }

  private set cachedValue(value: BrowserStorageSchema) {
    this._cachedValue = value;
    try {
      window.sessionStorage && window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      this.logWarning('Error serializing', e);
    }
  }

  private get cachedValue(): BrowserStorageSchema {
    if (!this._cachedValue) {
      this._cachedValue = this.deserializeAndValidateCachedValue();
    }
    return this._cachedValue;
  }

  get<K extends keyof BrowserStorageSchema>(key: K): BrowserStorageSchema[K] {
    return this.cachedValue[key];
  }

  update(updates: Partial<BrowserStorageSchema>) {
    this.cachedValue = {
      ...this.cachedValue,
      ...updates,
    };
  }

  clear() {
    this.cachedValue = DEFAULT_BROWSER_STORAGE;
  }
}

export const browserStorage = new BrowserStorage();

export const UpdateBrowserStorage: React.FC<Partial<BrowserStorageSchema>> = (props) => {
  useEffect(() => {
    browserStorage.update(props);
  }, Object.values(props));

  return null;
};
