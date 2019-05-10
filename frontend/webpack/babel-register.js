//@ts-nocheck

require('@babel/register')({
  presets: [
    ["@babel/env", {
      "targets": {
        "node": "current"
      }
    }],
  ],
  plugins: [
    '@babel/plugin-transform-typescript',
    '@babel/plugin-transform-react-jsx',
  ],
  extensions: ['.ts']
});
