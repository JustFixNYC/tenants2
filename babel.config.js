// This configuration should only be used for testing, but
// Babel might load it in other contexts, in which case we'll
// just return an empty object. This is because our Babel
// configuration is highly context-dependent (e.g. based on
// whether we are building it for execution in Node or the web),
// so we want to explicitly pass it in whenever possible.

module.exports = api => {
  return api.env('test')
    ? require('./frontend/webpack/base').nodeBabelOptions
    : {};
};
