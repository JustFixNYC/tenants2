// @ts-check

const SVGO = require('svgo');

const svgo = new SVGO({
  plugins: [{
    removeAttrs: { attrs: '(stroke|fill|data-name)' },
  }]
});

/**
 * This loader converts an SVG file into a React component. It outputs
 * JSX, which needs to be transpiled into regular JS by a separate loader
 * in the chain.
 * 
 * @param {string} source The raw SVG source code.
 * @returns {Promise<string>} The source code of a JSX module that exports
 *   the SVG as a React component.
 */
module.exports = async function(source) {
  const result = await svgo.optimize(source);

  return [
    `const React = require('react');`,
    ``,
    `module.exports = ${result.data};`
  ].join('\n');
};
