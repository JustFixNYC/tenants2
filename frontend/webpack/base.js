// @ts-check
/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 * @typedef {import("webpack").WebpackPluginInstance} WebpackPlugin
 * @typedef {import("webpack").RuleSetRule} WebpackRule
 */

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const LoadablePlugin = require("@loadable/webpack-plugin");
const NotifyServerOfNewBuildPlugin = require("./notify-server-of-new-build");
const { getEnvBoolean } = require("./env-util");
const { DEV_DEPS_AVAIL } = require("./are-dev-deps-available");

/** Are we in watch mode, or are we being run as a one-off process? */
const IN_WATCH_MODE = process.argv.includes("--watch");

const BASE_DIR = path.resolve(path.join(__dirname, "..", ".."));

const GIT_REVISION = process.env.GIT_REVISION || null;

const { WEBPACK_ADDITIONAL_MODULE_DIRS } = process.env;

if (!fs.existsSync("package.json")) {
  throw new Error(`Assertion failure, ${BASE_DIR} should contain package.json`);
}

if (DEV_DEPS_AVAIL && process.env["IGNORE_JUSTFIX_ENV_FILE"] !== "1") {
  require("dotenv").config({ path: path.join(BASE_DIR, ".justfix-env") });
}

const DISABLE_WEBPACK_ANALYZER =
  !DEV_DEPS_AVAIL || getEnvBoolean("DISABLE_WEBPACK_ANALYZER", true);

const DISABLE_DEV_SOURCE_MAPS = getEnvBoolean("DISABLE_DEV_SOURCE_MAPS", false);

/**
 * The source map to use for development builds that run in the browser.
 *
 * https://webpack.js.org/configuration/devtool/
 *
 * @type WebpackConfig["devtool"]
 */
const DEV_WEB_SOURCE_MAP = DISABLE_DEV_SOURCE_MAPS
  ? false
  : "eval-cheap-module-source-map";

/**
 * The source map to use for development builds that run on the server.
 *
 * Note that we've had some major issues with node reporting the correct
 * line number here. For more details, see:
 *
 *   https://github.com/JustFixNYC/tenants2/issues/2064
 *
 * @type WebpackConfig["devtool"]
 */
const DEV_NODE_SOURCE_MAP = DISABLE_DEV_SOURCE_MAPS
  ? false
  : "cheap-module-source-map";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** @type WebpackConfig["mode"] */
const MODE = IS_PRODUCTION ? "production" : "development";

const ENABLE_WEBPACK_CONTENT_HASH = getEnvBoolean(
  "ENABLE_WEBPACK_CONTENT_HASH",
  IS_PRODUCTION
);

const BUNDLE_FILENAME_TEMPLATE = ENABLE_WEBPACK_CONTENT_HASH
  ? "[name].[contenthash].bundle.js"
  : "[name].bundle.js";

const excludeMostOfNodeModules = /node_modules[\/\\](?!@justfixnyc)/;

exports.excludeMostOfNodeModules = excludeMostOfNodeModules;

/** These options are specific to babel-loader. */
const babelLoaderOptions = {
  cacheDirectory: true,
  cacheCompression: false,
};

const baseBabelOptions = {
  babelrc: false,
  presets: ["@babel/preset-typescript"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    "@babel/plugin-transform-react-jsx",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "babel-plugin-macros",
    "@loadable/babel-plugin",
  ],
};

const nodeBabelOptions = {
  ...baseBabelOptions,
  presets: [
    // Remember, presets are loaded from last to first!
    [
      "@babel/env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    ...baseBabelOptions.presets,
  ],
  plugins: [...baseBabelOptions.plugins, "babel-plugin-dynamic-import-node"],
};

exports.nodeBabelOptions = nodeBabelOptions;

const webBabelOptions = {
  ...baseBabelOptions,
  presets: [
    // Remember, presets are loaded from last to first!
    "@babel/preset-env",
    ...baseBabelOptions.presets,
  ],
};

/**
 * Our webpack rule for loading SVGs as React components.
 *
 * @type {WebpackRule}
 */
const convertSVGsToReactComponents = {
  test: /\.svg$/,
  exclude: /node_modules/,
  use: [
    // Our SVG loader generates JSX code, so we need to use
    // babel to convert it into regular JS.
    {
      loader: "babel-loader",
      options: {
        ...babelLoaderOptions,
        babelrc: false,
        plugins: ["@babel/plugin-transform-react-jsx"],
      },
    },
    { loader: path.resolve(__dirname, "svg-loader.js") },
  ],
};

/**
 * Our webpack rule for loading some files as raw text.
 *
 * @type {WebpackRule}
 */
const loadCssAsRawText = {
  test: /\.css$/,
  exclude: /node_modules/,
  use: [
    {
      loader: "raw-loader",
      options: {
        esModule: false,
      },
    },
  ],
};

/**
 * This returns an array of webpack plugins for all environments.
 *
 * @returns {WebpackPlugin[]} The array of plugins.
 */
function getCommonPlugins() {
  /** @type WebpackPlugin[] */
  const plugins = [
    new webpack.DefinePlugin({
      GIT_REVISION: JSON.stringify(GIT_REVISION),
      DISABLE_WEBPACK_ANALYZER,
      DISABLE_DEV_SOURCE_MAPS,
      ENABLE_WEBPACK_CONTENT_HASH,
    }),
  ];

  return plugins;
}

/**
 * This creates a webpack configuration for a command-line
 * node script written in TypeScript.
 *
 * @param {String} entry The entrypoint of the node script.
 * @param {String} filename The JS filename to output to.
 * @param {WebpackPlugin[]} extraPlugins Any extra plugins to include.
 * @returns {WebpackConfig}
 */
function createNodeScriptConfig(entry, filename, extraPlugins) {
  return {
    target: "node",
    stats: IN_WATCH_MODE ? "minimal" : "normal",
    entry,
    devtool: IS_PRODUCTION ? "source-map" : DEV_NODE_SOURCE_MAP,
    mode: MODE,
    externalsPresets: { node: true },
    externals: [
      nodeExternals({
        allowlist: [/^@justfixnyc/],
        additionalModuleDirs: WEBPACK_ADDITIONAL_MODULE_DIRS
          ? WEBPACK_ADDITIONAL_MODULE_DIRS.split(":")
          : [],
      }),
    ],
    output: {
      filename,
      path: path.resolve(BASE_DIR),
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    },
    module: {
      rules: [
        convertSVGsToReactComponents,
        loadCssAsRawText,
        {
          test: /\.[jt]sx?$/,
          exclude: excludeMostOfNodeModules,
          use: [
            {
              loader: "babel-loader",
              options: { ...nodeBabelOptions, ...babelLoaderOptions },
            },
          ],
        },
      ],
    },
    plugins: getCommonPlugins().concat(extraPlugins),
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  };
}

/**
 * This returns an array of webpack plugins for the web environment.
 *
 * It includes dynamic require() calls because some modules
 * won't be installed on production deployments.
 *
 * @returns {WebpackPlugin[]} The array of plugins.
 */
function getWebPlugins() {
  const plugins = getCommonPlugins();

  plugins.push(
    new LoadablePlugin({
      filename: "loadable-stats.json",
      writeToDisk: true,
    })
  );

  if (!DISABLE_WEBPACK_ANALYZER) {
    const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: "static",
        openAnalyzer: false,
      })
    );
  }

  return plugins;
}

/**
 * This is our webpack configuration for the web front-end.
 *
 * @type {WebpackConfig}
 */
const webConfig = {
  target: ["web", "es5"],
  stats: IN_WATCH_MODE ? "minimal" : "normal",
  entry: {
    main: [
      "core-js/stable",
      "regenerator-runtime/runtime",
      "./frontend/lib/main.ts",
    ],
  },
  devtool: IS_PRODUCTION ? "source-map" : DEV_WEB_SOURCE_MAP,
  mode: MODE,
  output: {
    filename: BUNDLE_FILENAME_TEMPLATE,
    chunkFilename: BUNDLE_FILENAME_TEMPLATE,
    path: path.resolve(BASE_DIR, "frontend", "static", "frontend"),
  },
  module: {
    rules: [
      convertSVGsToReactComponents,
      loadCssAsRawText,
      {
        test: /\.[jt]sx?$/,
        exclude: excludeMostOfNodeModules,
        use: [
          {
            loader: "babel-loader",
            options: { ...webBabelOptions, ...babelLoaderOptions },
          },
        ],
      },
    ],
  },
  plugins: getWebPlugins(),
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

exports.webConfig = webConfig;

exports.lambdaConfig = createNodeScriptConfig(
  "./frontend/lambda/lambda.tsx",
  "lambda.js",
  [new NotifyServerOfNewBuildPlugin(process.env.LAMBDA_POST_BUILD_NOTIFY_URL)]
);

const webpackConfigs = [exports.lambdaConfig, webConfig];

exports.allConfigs = webpackConfigs;
