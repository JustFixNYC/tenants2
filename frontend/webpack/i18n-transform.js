// @ts-check
/**
 * @typedef {import("@babel/core").Visitor<State>} StateVisitor
 * @typedef {import("@babel/core").PluginObj<State>} StatePlugin
 * @typedef {import("@babel/core")} Babel
 * @typedef {import("./i18n-transform-types").I18nTransformState} State
 */

const fsPath = require('path');
const assert = require('assert');
const fs = require('fs');

const I18N_PATH = fsPath.normalize(fsPath.join(__dirname, '..', 'lib', 'i18n.tsx'));

assert(fs.existsSync(I18N_PATH));

 /**
  * @param {Babel} babel 
  * @returns {StatePlugin}
  */
module.exports = function(babel) {
  const t = babel.types;

  /** @type StateVisitor */
  const visitor = {
    JSXText: function(path, state) {
      const { node } = path;
      const value = node.value.trim();
      if (value) {
        if (state.opts.uppercase) {
          node.value = node.value.toUpperCase();
        }
        if (state.opts.func) {
          const jsxEl = path.findParent(path => path.isJSXElement());
          if (!path.scope.hasBinding('i18n')) {
            const program = path.findParent(path => path.isProgram());
            if (program.isProgram()) {
              /** @type any TODO: What is going on with these types?? */
              const id = t.identifier('i18n');
              /** @type any TODO: What is going on with these types?? */
              const init = t.memberExpression(
                t.callExpression(t.identifier('require'), [
                  t.stringLiteral(I18N_PATH)
                ]),
                t.identifier('i18n')
              );
              program.scope.push({
                id,
                init
              });
            }
          }

          let tagName = undefined;
          if (jsxEl.isJSXElement()) {
            const { name } = jsxEl.node.openingElement;
            if (name.type === 'JSXIdentifier') {
              tagName = name.name;
            }
          }

          const callArgs = [t.stringLiteral(node.value)];
          if (tagName) {
            callArgs.push(t.stringLiteral(tagName));
          }
          const callExpr = t.callExpression(t.identifier('i18n'), callArgs);
          /** @type any TODO: What is going on with these types?? */
          const jsxExpr = t.jsxExpressionContainer(callExpr);

          path.replaceWith(jsxExpr);
        }
      }
    }
  };

  return {
    visitor
  };
}
