// @ts-check
/**
 * @typedef {import("@babel/core").Visitor<State>} StateVisitor
 * @typedef {import("./i18-transform-types").I18nTransformState} State
 */

module.exports = function() {
  /** @type StateVisitor */
  const visitor = {
    JSXText: function(path, state) {
      const { node } = path;
      const value = node.value.trim();
      if (value) {
        if (state.opts.uppercase) {
          node.value = node.value.toUpperCase();
        }
      }
    }
  };

  return { visitor };
}
