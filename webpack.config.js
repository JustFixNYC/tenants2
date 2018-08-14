// @ts-check
const path = require('path');
const nodeExternals = require('webpack-node-externals');

try {
  require('dotenv').config({ path: path.join(__dirname, '.justfix-env') });
} catch (e) {
  // dotenv is a dev dependency, so no biggie if it can't be found.
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 * @typedef {import("webpack").Plugin} WebpackPlugin
 */

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
    mode: 'development',
    externals: [nodeExternals()],
    output: {
      filename,
      path: path.resolve(__dirname)
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'ts-loader' }
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
 * This returns an array of webpack plugins used for development,
 * or an empty array if we're on a production deployment.
 * 
 * It includes dynamic require() calls because the modules
 * won't be installed on production deployments.
 * 
 * @returns {WebpackPlugin[]} The array of plugins.
 */
function getWebDevPlugins() {
  if (IS_PRODUCTION) {
    return [];
  }

  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

  return [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    })
  ];
}

/**
 * This is our webpack configuration for the web front-end.
 *
 * @type {WebpackConfig}
 */
const webConfig = {
  target: 'web',
  entry: ['babel-polyfill', './frontend/lib/main.ts'],
  devtool: 'inline-source-map',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend', 'static', 'frontend')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          { loader: 'ts-loader' }
        ]
      },
    ]
  },
  plugins: getWebDevPlugins(),
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};

module.exports = [
  createNodeScriptConfig('./frontend/lambda/lambda.ts', 'lambda.js'),
  createNodeScriptConfig('./frontend/querybuilder/querybuilder.ts', 'querybuilder.js'),
  webConfig,
];
