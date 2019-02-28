module.exports = require('babel-jest').createTransformer({
  presets: [
    ['@babel/preset-env', {
      targets: {
        "node": "current"
      }
    }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    '@babel/plugin-proposal-class-properties',
    "@babel/plugin-syntax-dynamic-import",
    "babel-plugin-dynamic-import-node-babel-7",
  ]
});
