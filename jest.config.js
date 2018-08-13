module.exports = {
  "testURL": "http://localhost",
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "((\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "setupTestFrameworkScriptFile": "./frontend/lib/tests/setup.ts"
};
