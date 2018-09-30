// @ts-check
/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 * @typedef {import("webpack").Plugin} WebpackPlugin
 * @typedef {import("ts-loader").Options} TsLoaderOptions
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { ReactLoadablePlugin } = require('react-loadable/webpack');
const { getEnvBoolean } = require('./env-util');

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

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

 /** @type WebpackConfig["mode"] */
const MODE = IS_PRODUCTION ? 'production' : 'development';

/** @type Partial<TsLoaderOptions> */
const tsLoaderOptions = {
  /**
   * Without this setting, TypeScript compiles *everything* including
   * files not relevant to the bundle we're building, which often
   * results in spurious errors. For more information, see
   * https://github.com/TypeStrong/ts-loader/issues/267.
   */
  onlyCompileBundledFiles: true,
  compilerOptions: {
    /**
     * Allow unused locals during development, because it's useful for
     * tinkering. Our linter will error on them to ensure that CI fails
     * if code is committed with them.
     */
    noUnusedLocals: false
  }
};

const baseBabelOptions = {
  babelrc: false,
  plugins: [
    "babel-plugin-transform-object-rest-spread",
    "babel-plugin-syntax-dynamic-import",
    "react-loadable/babel"
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
      DISABLE_WEBPACK_ANALYZER
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
    entry,
    devtool: IS_PRODUCTION ? 'source-map' : 'inline-source-map',
    mode: MODE,
    externals: [nodeExternals()],
    output: {
      filename,
      path: path.resolve(BASE_DIR),
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'babel-loader', options: baseBabelOptions },
            { loader: 'ts-loader', options: tsLoaderOptions }
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
  entry: {
    main: ['babel-polyfill', './frontend/lib/main.ts'],
  },
  devtool: IS_PRODUCTION ? 'source-map' : 'inline-source-map',
  mode: MODE,
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(BASE_DIR, 'frontend', 'static', 'frontend')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              ...baseBabelOptions,
              presets: ["env"],
            }
          },
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

const webpackConfigs = [
  createNodeScriptConfig('./frontend/lambda/lambda.tsx', 'lambda.js'),
  webConfig,
];

if (DEV_DEPS_AVAIL) {
  exports.querybuilderConfig = createNodeScriptConfig('./frontend/querybuilder/cli.ts', 'querybuilder.js');
  webpackConfigs.push(exports.querybuilderConfig);
}

exports.allConfigs = webpackConfigs;
