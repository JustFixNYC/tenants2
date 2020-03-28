import { useEffect } from "react";

/**
 * Any schema we store in the browser should at least contain a
 * schema version number, so we know whether our code is compatible
 * with it.
 */
export type BaseBrowserStorageSchema = {
  _version: number,
};

/**
 * Return the browser's `window.sessionStorage`, or null if we're either
 * not running in the browser or `sessionStorage` isn't implemented.
 */
function getSessionStorage(): Pick<Storage, 'getItem'|'setItem'>|null {
  if (typeof(window) === 'undefined') return null;
  return window.sessionStorage || null;
};

/**
 * This class is responsible for storing data browser-side using
 * `window.sessionStorage` using a versioned schema. The data is
 * serialized and deserialized via JSON.
 * 
 * This class is intended to be used as a progressive
 * enhancement; while it is highly fault-tolerant and won't throw 
 * exceptions if the runtime doesn't support session storage, or if
 * session storage is full, the data will only last as long as the
 * lifetime of the `BrowserStorage` instance, rather than the lifetime of the
 * browser session, so it shouldn't be depended upon for mission-critical
 * data.
 */
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

  /**
   * Returns the current stored value, deserializing from browser storage if
   * needed.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.cachedValue[key];
  }

  /**
   * Updates part or all of the current stored value, serializing it to browser
   * storage.
   */
  update(updates: Partial<T>) {
    this.cachedValue = {
      ...this.cachedValue,
      ...updates,
    };
  }

  /** Clears the current stored value, resetting it to its default. */
  clear() {
    this.cachedValue = this.defaultValue;
  }
}

/**
 * A factory function for creating a React component that can be used to
 * declaratively update part or all of data in browser storage.
 */
export function createUpdateBrowserStorage<T extends BaseBrowserStorageSchema>(
  browserStorage: BrowserStorage<T>
): React.FC<Partial<T>> {
  return props => {
    useEffect(() => {
      browserStorage.update(props);
    });

    return null;
  };
};
