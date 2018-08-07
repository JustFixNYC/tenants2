const path = require('path');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
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
      }
    ]
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    })
  ],
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};
