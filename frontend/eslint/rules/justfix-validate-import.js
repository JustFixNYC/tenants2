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

/**
 * @param {string} importStr
 * @param {string} filename
 */
function get_RE_Case(importStr, filename) {
  if (TESTS_DIR_RE.test(importStr) && !TESTS_DIR_RE.test(filename))
    return "test code";
  if (TRANS_REACT_RE.test(importStr)) return "lingui/react";
  return undefined;
}

/** @type import("eslint").Rule.RuleModule */
module.exports = {
  create: function (context) {
    return {
      ImportDeclaration(node) {
        assert(node.type === "ImportDeclaration");
        assert(typeof node.source.value === "string");
        const importStr = node.source.value;
        const filename = context.getFilename();
        let key = get_RE_Case(importStr, filename);
        switch (key) {
          case "test code":
            context.report({
              node,
              message: `Production code is importing test suite code at "${importStr}"!`,
            });
            break;
          case "lingui/react":
            node.specifiers &&
              node.specifiers.map((item) => {
                if (
                  item.type === "ImportSpecifier" &&
                  item.imported.name === "Trans"
                ) {
                  context.report({
                    node,
                    message: `Trans imported from "${importStr}", please import from @lingui/macro`,
                  });
                }
              });
            break;
          default:
            break;
        }
      },
    };
  },
};
