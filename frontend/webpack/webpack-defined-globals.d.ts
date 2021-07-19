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
 * Setting this to true can speed up builds.
 *
 * This defaults to true.
 */
declare const DISABLE_WEBPACK_ANALYZER: boolean;

/**
 * Whether or not to disable source maps in development mode.
 *
 * Setting this to true can speed up builds.
 */
declare const DISABLE_DEV_SOURCE_MAPS: boolean;

/**
 * Whether or not to include a bundle's content hash in its
 * file name. This defaults to true when NODE_ENV is "production",
 * otherwise it defaults to false.
 */
declare const ENABLE_WEBPACK_CONTENT_HASH: boolean;

/**
 * This is the hash of the git revision used to build
 * the front-end and the server-side renderer, or `null` if
 * unknown.
 *
 * It should not be confused with the git revision of
 * the back-end at the time that the front-end is running.
 *
 * During development, this will be null.
 */
declare const GIT_REVISION: string | null;
