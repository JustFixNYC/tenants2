// @ts-check
/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 * @typedef {import("webpack").Plugin} WebpackPlugin
 * @typedef {import("ts-loader").Options} TsLoaderOptions
 */

const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { ReactLoadablePlugin } = require('react-loadable/webpack');

const BASE_DIR = __dirname;

try {
  require('dotenv').config({ path: path.join(BASE_DIR, '.justfix-env') });
} catch (e) {
  // dotenv is a dev dependency, so no biggie if it can't be found.
}

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
  onlyCompileBundledFiles: true
};

const baseBabelOptions = {
  babelrc: false,
  plugins: [
    "babel-plugin-syntax-dynamic-import",
    "react-loadable/babel"
  ]
};

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
    // Tried source-map-support but the line numbers are weird, so
    // disabling source map support for now.
    devtool: undefined,
    mode: MODE,
    externals: [nodeExternals()],
    output: {
      filename,
      path: path.resolve(BASE_DIR)
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
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
  };
}

/**
 * This returns an array of webpack plugins.
 * 
 * It includes dynamic require() calls because some modules
 * won't be installed on production deployments.
 * 
 * @returns {WebpackPlugin[]} The array of plugins.
 */
function getPlugins() {
  /** @type WebpackPlugin[] */
  const plugins = [];

  plugins.push(new ReactLoadablePlugin({
    filename: 'react-loadable.json'
  }));

  try {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }));
  } catch (e) {
    // The bundle analyzer is a dev dependency, so ignore if it's not found.
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
              plugins: [
                ...baseBabelOptions.plugins,
                "babel-plugin-transform-object-rest-spread",
              ],
            }
          },
          { loader: 'ts-loader', options: tsLoaderOptions }
        ]
      },
    ]
  },
  plugins: getPlugins(),
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};

module.exports = [
  createNodeScriptConfig('./frontend/lambda/lambda.ts', 'lambda.js'),
  createNodeScriptConfig('./frontend/querybuilder/querybuilder.ts', 'querybuilder.js'),
  webConfig,
];
