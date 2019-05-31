const path = require('path');
const assert = require('assert');

const { nodeBabelOptions } = require('./frontend/webpack/base');

assert(nodeBabelOptions);

module.exports = {
  "globals": {
    "ts-jest": {
      "babelConfig": nodeBabelOptions,
      "tsConfig": "tsconfig.build.json"
    }
  },
  "testURL": "http://localhost",
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "roots": [
    "frontend"
  ],
  "collectCoverage": true,
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "safe-mode-globals.d.ts",
    "webpack-defined-globals.d.ts",
    "/frontend/vendor/",
  ],
  "watchPathIgnorePatterns": [
    "<rootDir>/frontend/lib/queries/__generated__/",
  ],
  "coverageReporters": [
    "lcov",
    "html"
  ],
  "coverageDirectory": "./coverage/jest/",
  "testRegex": "((\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "moduleNameMapper": {
    "\\.svg$": path.join(__dirname, "frontend", "mocks", "svg-mock.js")
  },
  "restoreMocks": true,
  "setupFilesAfterEnv": [
    "./frontend/lib/tests/setup.ts"
  ]
};
