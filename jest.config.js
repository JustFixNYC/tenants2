module.exports = {
  "testURL": "http://localhost",
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "roots": [
    "frontend"
  ],
  "collectCoverage": true,
  "coverageReporters": [
    "lcov",
    "text",
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
  "setupTestFrameworkScriptFile": "./frontend/lib/tests/setup.ts"
};
