/**
 * The following values are globals in our JS/TS bundles, defined
 * by Webpack's DefinePlugin. Unless otherwise noted, they are derived
 * from environment variables of the same name.
 * 
 * If a variable has a boolean value, it is expected to have a value
 * like "true" or "yes" for true, or "false" or "no" for false. It
 * also defaults to false if it's undefined or empty, unless
 * otherwise noted.
 */

/**
 * Whether or not to disable the webpack analyzer.
 * 
 * This is derived from an environment variable of the same name.
 */
declare const DISABLE_WEBPACK_ANALYZER: boolean;
