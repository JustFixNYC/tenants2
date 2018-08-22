import classnames from 'classnames';

/**
 * A list of all valid Bulma class names.
 * 
 * If this gets really annoying to maintain, we can just change this
 * type to be a string.
 */
export type BulmaClassName = 
  'is-active' |
  'has-dropdown' |
  'navbar-burger' |
  'navbar-menu' |
  'navbar-item';

type BulmaClassNameMap = {
  [K in BulmaClassName]?: boolean;
}

type BulmaItem = BulmaClassName | null | undefined | false | BulmaClassNameMap;

/**
 * This is like classnames(), but for Bulma classes.
 * 
 * For more information, see: https://github.com/JedWatson/classnames#usage
 */
export function bulmaClasses(...items: BulmaItem[]): string {
  return classnames(...items);
}
