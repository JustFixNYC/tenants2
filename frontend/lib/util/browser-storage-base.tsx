import { useEffect, useState, useCallback } from "react";
import { isDeepEqual } from "./util";

/**
 * Any schema we store in the browser should at least contain a
 * schema version number, so we know whether our code is compatible
 * with it.
 */
export type BaseBrowserStorageSchema = {
  _version: number;
};

/**
 * Return the browser's `window.sessionStorage`, or null if we're either
 * not running in the browser or `sessionStorage` isn't implemented.
 */
function getSessionStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage || null;
}

type ChangeListener<T> = (value: T) => void;

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
  private changeListeners: ChangeListener<T>[] = [];

  constructor(
    readonly defaultValue: T,
    readonly storageKey: string,
    readonly storage = getSessionStorage()
  ) {
    this.schemaVersion = defaultValue._version;
  }

  private logWarning(msg: string, e?: Error) {
    if (process.env.NODE_ENV !== "production") {
      const finalMsg = `${msg} ${this.constructor.name}`;
      e ? console.warn(finalMsg, e) : console.warn(finalMsg);
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
      this.logWarning("Error deserializing", e);
    }
    return this.defaultValue;
  }

  private set cachedValue(value: T) {
    this._cachedValue = value;
    try {
      this.storage &&
        this.storage.setItem(this.storageKey, JSON.stringify(value));
    } catch (e) {
      this.logWarning("Error serializing", e);
    }
    this.changeListeners.forEach((cb) => cb(value));
  }

  private get cachedValue(): T {
    if (!this._cachedValue) {
      this._cachedValue = this.getCachedValueOrDefault();
    }
    return this._cachedValue;
  }

  /**
   * Listens for changes to the current stored value, calling the given
   * callback whenever it happens.  Returns a function that, when called,
   * will unsubscribe the listener.
   */
  listenForChanges(listener: ChangeListener<T>): () => void {
    this.changeListeners.push(listener);
    return () => {
      const idx = this.changeListeners.indexOf(listener);
      if (idx === -1) {
        return this.logWarning("Unable to find change listener");
      }
      this.changeListeners.splice(idx, 1);
    };
  }

  /**
   * Returns a key of the current stored value, deserializing from browser storage if
   * needed.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.cachedValue[key];
  }

  /**
   * Returns the entire current stored value, deserializing from browser storage if
   * needed.
   *
   * Note that the return value should never be modified in-place--use the
   * `update()` method instead.
   */
  getAll(): T {
    return this.cachedValue;
  }

  /**
   * Updates part or all of the current stored value, serializing it to browser
   * storage.
   *
   * If the passed-in updates won't actually modify the current stored value,
   * nothing is done.
   */
  update(updates: Partial<T>) {
    const newValue: T = {
      ...this.cachedValue,
      ...updates,
    };
    if (!isDeepEqual(newValue, this.cachedValue)) {
      this.cachedValue = newValue;
    }
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
  return (props) => {
    useEffect(() => {
      browserStorage.update(props);
    });

    return null;
  };
}

/**
 * Creates a `useBrowserStorage` React Hook that can be used in a way that
 * is similar to `useState()`, only it returns/updates the value of browser
 * storage.
 *
 * Before a component is mounted, this will actually return the storage's
 * default value to ensure that rendering is identical on server and client.
 */
export function createUseBrowserStorage<T extends BaseBrowserStorageSchema>(
  browserStorage: BrowserStorage<T>
) {
  const useBrowserStorage = (): [T, (updates: Partial<T>) => void] => {
    const [state, setState] = useState(browserStorage.defaultValue);
    const updateState = useCallback((updates: Partial<T>) => {
      browserStorage.update(updates);
    }, []);

    // Listen for changes to browser storage for the lifetime of
    // the component that's using our hook.
    useEffect(() => {
      setState(browserStorage.getAll());
      return browserStorage.listenForChanges((newState) => {
        setState(newState);
      });
    }, []);

    return [state, updateState];
  };
  return useBrowserStorage;
}
