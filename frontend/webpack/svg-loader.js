// @ts-check

// We used to use svgo for this, but it didn't do anything to SVGs with
// multiple paths, which resulted in malformed JSX (since class attributes
// weren't removed, among other things) so we'll just roll our own SVG
// optimization with cheerio.
const cheerio = require("cheerio");

/**
 * This loader converts an SVG file into a React component. It outputs
 * JSX, which needs to be transpiled into regular JS by a separate loader
 * in the chain.
 *
 * @param {string} source The raw SVG source code.
 * @returns {Promise<string>} The source code of a JSX module that exports
 *   the SVG as a React component.
 */
module.exports = async function (source) {
  const $ = cheerio.load(source, { xmlMode: true });

  $("defs, title").remove();
  $("[class]").removeAttr("class");
  $("[id]").removeAttr("id");
  $("[data-name]").removeAttr("data-name");

  return [
    `const React = require('react');`,
    ``,
    `module.exports = ${$.html()};`,
  ].join("\n");
};
