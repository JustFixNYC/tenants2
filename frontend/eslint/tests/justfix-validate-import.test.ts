import { RuleTester } from "eslint";

import rule from "../rules/justfix-validate-import";

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015, sourceType: "module" },
});

ruleTester.run("justfix-validate-import", rule, {
  valid: [
    {
      code: "import boop from '../boop'",
      filename: "lib/tests/boop.test.ts",
    },
  ],
  invalid: [
    {
      code: "import boop from '../tests/boop'",
      filename: "lib/main.ts",
      errors: [
        {
          message:
            'Production code is importing test suite code at "../tests/boop"!',
        },
      ],
    },
  ],
});
