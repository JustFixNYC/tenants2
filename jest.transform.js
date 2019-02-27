module.exports = require('babel-jest').createTransformer({
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        "targets": {
          "node": "current",
        }
      }
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    '@babel/plugin-proposal-class-properties',
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
    "babel-plugin-dynamic-import-node-babel-7",
    '@babel/plugin-transform-react-jsx'
  ]
});
