import { useEffect } from "react";

const TENANTS2_SCHEMA_VERSION = 1;

const TENANTS2_SESSION_STORAGE_KEY = `tenants2_v${TENANTS2_SCHEMA_VERSION}`;

export type BaseBrowserStorageSchema = {
  _version: number,
};

export type TenantsBrowserStorageSchema = BaseBrowserStorageSchema & {
  latestAddress?: string,
  latestBorough?: string,
};

const TENANTS2_DEFAULT_BROWSER_STORAGE: TenantsBrowserStorageSchema = {
  _version: TENANTS2_SCHEMA_VERSION,
};

function getSessionStorage(): Pick<Storage, 'getItem'|'setItem'>|null {
  if (typeof(window) === 'undefined') return null;
  return window.sessionStorage || null;
};

export class BrowserStorage<T extends BaseBrowserStorageSchema> {
  private _cachedValue?: T;
  private readonly schemaVersion: number;

  constructor(readonly defaultValue: T, readonly storageKey: string, readonly storage = getSessionStorage()) {
    this.schemaVersion = defaultValue._version;
  }

  private logWarning(msg: string, e: Error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${msg} ${this.constructor.name}`, e);
    }
  }

  private deserializeAndValidateCachedValue(value: string): T {
    let obj = JSON.parse(value) as T;
    if (obj && obj._version === this.schemaVersion) {
      return obj;
    }
    throw new Error(`Stored schema is not version ${this.schemaVersion}`);
  }

  private getCachedValueOrDefault(): T {
    try {
      let value = this.storage && this.storage.getItem(this.storageKey);
      if (value) {
        return this.deserializeAndValidateCachedValue(value);
      }
    } catch (e) {
      this.logWarning('Error deserializing', e);
    }
    return this.defaultValue;
  }

  private set cachedValue(value: T) {
    this._cachedValue = value;
    try {
      this.storage && this.storage.setItem(this.storageKey, JSON.stringify(value));
    } catch (e) {
      this.logWarning('Error serializing', e);
    }
  }

  private get cachedValue(): T {
    if (!this._cachedValue) {
      this._cachedValue = this.getCachedValueOrDefault();
    }
    return this._cachedValue;
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.cachedValue[key];
  }

  update(updates: Partial<T>) {
    this.cachedValue = {
      ...this.cachedValue,
      ...updates,
    };
  }

  clear() {
    this.cachedValue = this.defaultValue;
  }
}

export const browserStorage = new BrowserStorage(TENANTS2_DEFAULT_BROWSER_STORAGE, TENANTS2_SESSION_STORAGE_KEY);

export const UpdateBrowserStorage: React.FC<Partial<TenantsBrowserStorageSchema>> = (props) => {
  useEffect(() => {
    browserStorage.update(props);
  }, Object.values(props));

  return null;
};
