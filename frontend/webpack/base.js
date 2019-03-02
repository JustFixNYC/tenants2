// @ts-check
/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 * @typedef {import("webpack").Plugin} WebpackPlugin
 * @typedef {import("webpack").RuleSetRule} WebpackRule
 * @typedef {import("ts-loader").Options} TsLoaderOptions
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { ReactLoadablePlugin } = require('react-loadable/webpack');
const { getEnvBoolean } = require('./env-util');

/** Are we in watch mode, or are we being run as a one-off process? */
const IN_WATCH_MODE = process.argv.includes('--watch');

/** @type {boolean} Whether or not development dependencies are installed. */
let DEV_DEPS_AVAIL = (() => {
  try {
    require('dotenv');
    return true;
  } catch (e) {
    return false;
  }
})();

const BASE_DIR = path.resolve(path.join(__dirname, '..', '..'));

if (!fs.existsSync('package.json')) {
  throw new Error(`Assertion failure, ${BASE_DIR} should contain package.json`);
}

if (DEV_DEPS_AVAIL) {
  require('dotenv').config({ path: path.join(BASE_DIR, '.justfix-env') });
}

const DISABLE_WEBPACK_ANALYZER = getEnvBoolean('DISABLE_WEBPACK_ANALYZER', false) || !DEV_DEPS_AVAIL;

const DISABLE_DEV_SOURCE_MAPS = getEnvBoolean('DISABLE_DEV_SOURCE_MAPS', false);

/** @type WebpackConfig["devtool"] */
const DEV_SOURCE_MAP = DISABLE_DEV_SOURCE_MAPS ? false : 'inline-source-map';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

 /** @type WebpackConfig["mode"] */
const MODE = IS_PRODUCTION ? 'production' : 'development';

const ENABLE_WEBPACK_CONTENT_HASH = getEnvBoolean('ENABLE_WEBPACK_CONTENT_HASH', IS_PRODUCTION);

const BUNDLE_FILENAME_TEMPLATE = ENABLE_WEBPACK_CONTENT_HASH
                                 ? '[name].[contenthash].bundle.js'
                                 : '[name].bundle.js';

/** @type Partial<TsLoaderOptions> */
const tsLoaderOptions = {
  configFile: "tsconfig.build.json",
  /**
   * Without this setting, TypeScript compiles *everything* including
   * files not relevant to the bundle we're building, which often
   * results in spurious errors. For more information, see
   * https://github.com/TypeStrong/ts-loader/issues/267.
   */
  onlyCompileBundledFiles: true,
  /**
   * We're going to run the type checker in a separate process, so
   * only transpile for now. This significantly improves compile speed.
   */
  transpileOnly: true,
};

const baseBabelOptions = {
  babelrc: false,
  plugins: [
    "babel-plugin-macros",
    "@lingui/babel-plugin-transform-js",
    "@lingui/babel-plugin-transform-react",
    "@babel/plugin-transform-react-jsx",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
    "react-loadable/babel"
  ]
};

const nodeBabelOptions = {
  ...baseBabelOptions,
  presets: [
    ["@babel/env", {
      "targets": {
        "node": "current"
      }
    }],
  ],
  plugins: [
    ...baseBabelOptions.plugins,
    "babel-plugin-dynamic-import-node"
  ]
};

exports.nodeBabelOptions = nodeBabelOptions;

const webBabelOptions = {
  ...baseBabelOptions,
  presets: ["@babel/preset-env"]
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
    { loader: 'babel-loader', options: {
      babelrc: false,
      plugins: ['@babel/plugin-transform-react-jsx']
    } },
    { loader: path.resolve(__dirname, 'svg-loader.js') }
  ]
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
      DISABLE_WEBPACK_ANALYZER,
      DISABLE_DEV_SOURCE_MAPS,
      ENABLE_WEBPACK_CONTENT_HASH
    })
  ];

  return plugins;
}

/**
 * This creates a webpack configuration for a command-line
 * node script written in TypeScript.
 * 
 * @param {String} entry The entrypoint of the node script.
 * @param {String} filename The JS filename to output to.
 * @returns {WebpackConfig}
 */
function createNodeScriptConfig(entry, filename) {
  return {
    target: 'node',
    stats: IN_WATCH_MODE ? 'minimal' : 'normal',
    entry,
    devtool: IS_PRODUCTION ? 'source-map' : DEV_SOURCE_MAP,
    mode: MODE,
    externals: [nodeExternals()],
    output: {
      filename,
      path: path.resolve(BASE_DIR),
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    module: {
      rules: [
        convertSVGsToReactComponents,
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'babel-loader', options: nodeBabelOptions },
            { loader: 'ts-loader', options: tsLoaderOptions },
          ]
        },
      ]
    },
    plugins: getCommonPlugins(),
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
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

  plugins.push(new ReactLoadablePlugin({
    filename: 'react-loadable.json'
  }));

  if (!DISABLE_WEBPACK_ANALYZER) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }));
  }

  return plugins;
}

/**
 * This is our webpack configuration for the web front-end.
 *
 * @type {WebpackConfig}
 */
const webConfig = {
  target: 'web',
  stats: IN_WATCH_MODE ? 'minimal' : 'normal',
  entry: {
    main: ['@babel/polyfill', './frontend/lib/main.ts'],
  },
  devtool: IS_PRODUCTION ? 'source-map' : DEV_SOURCE_MAP,
  mode: MODE,
  output: {
    filename: BUNDLE_FILENAME_TEMPLATE,
    chunkFilename: BUNDLE_FILENAME_TEMPLATE,
    path: path.resolve(BASE_DIR, 'frontend', 'static', 'frontend')
  },
  module: {
    rules: [
      convertSVGsToReactComponents,
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader', options: webBabelOptions },
          { loader: 'ts-loader', options: tsLoaderOptions }
        ]
      },
    ]
  },
  plugins: getWebPlugins(),
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};

exports.webConfig = webConfig;

exports.lambdaConfig = createNodeScriptConfig('./frontend/lambda/lambda.tsx', 'lambda.js');

const webpackConfigs = [
  exports.lambdaConfig,
  webConfig,
];

if (DEV_DEPS_AVAIL) {
  exports.querybuilderConfig = createNodeScriptConfig('./frontend/querybuilder/cli.ts', 'querybuilder.js');
  webpackConfigs.push(exports.querybuilderConfig);
}

exports.allConfigs = webpackConfigs;
