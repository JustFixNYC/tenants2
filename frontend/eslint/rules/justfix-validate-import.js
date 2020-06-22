// @ts-check

const TESTS_DIR_RE = /[\/\\]tests[\/\\]/;
const TRANS_REACT_RE = /@lingui[\/\\]react/;
/**
 * Assert that the given condition is true; propagates to TypeScript.
 *
 * @param {boolean} condition
 * @returns {asserts condition}
 */
function assert(condition) {
  if (!condition) {
    throw new Error("Assertion failed!");
  }
}

/** @type import("eslint").Rule.RuleModule */
module.exports = {
  create: function (context) {
    let message = "";
    return {
      ImportDeclaration(node) {
        assert(node.type === "ImportDeclaration");
        assert(typeof node.source.value === "string");
        const importStr = node.source.value;
        const filename = context.getFilename();
        if (TESTS_DIR_RE.test(importStr) && !TESTS_DIR_RE.test(filename)) {
            message = `Production code is importing test suite code at "${importStr}"!`;
        }
        if (TRANS_REACT_RE.test(importStr)) {
          node.specifiers && node.specifiers.map((item) => {
            if (item.type === "ImportSpecifier" &&item.imported.name === "Trans") {
                message = `Trans imported from "${importStr}", please import from @lingui/macro`;
            }
          });    
        }
        context.report({
          node,
          message,
        });
      }
    }
  }
}
