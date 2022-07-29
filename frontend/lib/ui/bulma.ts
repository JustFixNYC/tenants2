import classnames from "classnames";

/**
 * A list of all valid Bulma class names.
 *
 * If this gets really annoying to maintain, we can just change this
 * type to be a string.
 */

export type BulmaImageClass =
  | "is-128x128"
  | "is-16by9"
  | "is-16x16"
  | "is-1by1"
  | "is-1by2"
  | "is-1by3"
  | "is-12x12"
  | "is-24x24"
  | "is-2by1"
  | "is-2by3"
  | "is-32x32"
  | "is-3by1"
  | "is-3by2"
  | "is-3by4"
  | "is-3by5"
  | "is-48x48"
  | "is-4by3"
  | "is-4by5"
  | "is-5by3"
  | "is-5by4"
  | "is-64x64"
  | "is-96x96"
  | "is-9by16"
  | "is-square";

export type BulmaClassName =
  | "is-active"
  | "is-primary"
  | "is-success"
  | "is-loading"
  | "is-danger"
  | "is-text"
  | "is-light"
  | "is-normal"
  | "is-medium"
  | "is-large"
  | "is-fullwidth"
  | "has-dropdown"
  | "control"
  | "select"
  | "input"
  | "button"
  | "textarea"
  | "navbar-burger"
  | "navbar-menu"
  | "navbar-item"
  | BulmaImageClass;

type BulmaClassNameMap = {
  [K in BulmaClassName]?: boolean;
};

type BulmaItem = BulmaClassName | null | undefined | false | BulmaClassNameMap;

/**
 * This is like classnames(), but for Bulma classes.
 *
 * For more information, see: https://github.com/JedWatson/classnames#usage
 */
export function bulmaClasses(...items: BulmaItem[]): string {
  return classnames(...items);
}
