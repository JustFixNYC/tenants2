const assert = require("assert");

const { nodeBabelOptions } = require("./frontend/webpack/base");

let { presets, plugins } = nodeBabelOptions;

assert(presets && plugins);

module.exports = {
  extractBabelOptions: { presets, plugins },
  localeDir: "locales/",
  srcPathDirs: ["frontend/lib/", "common-data/"],
  format: "po",
  sourceLocale: "en",
};
