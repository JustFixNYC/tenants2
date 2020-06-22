import { RuleTester } from "eslint";

import rule from "../rules/justfix-validate-trans-import";

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015, sourceType: "module" },
});

ruleTester.run("justfix-validate-import", rule, {
  valid: [
    {
      code: "import boop from '../boop'",
    },
  ],
  invalid: [
    {
      code: "import boop from '../lingui/boop'",
      errors: [
        {
          message:
            'Production code is importing test suite code at "../lingui/boop"!',
        },
      ],
    },
  ],
});
