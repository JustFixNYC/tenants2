const assert = require('assert');

const { nodeBabelOptions } = require('./frontend/webpack/base');

let { presets, plugins } = nodeBabelOptions;

assert(presets && plugins);

// TODO: We probably won't have to do this if we just use the lingui preset
// instead of the individual plugins.
plugins = plugins.filter(p => !/^@lingui\/babel-plugin-transform/.test(p));

module.exports = {
  "extractBabelOptions": { presets, plugins },
  "localeDir": "frontend/locales/",
  "srcPathDirs": [
    "frontend/lib"
  ],
  "format": "minimal"
};
