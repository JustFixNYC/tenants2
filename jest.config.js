const path = require("path");

module.exports = {
  testURL: "http://localhost",
  roots: ["frontend"],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "safe-mode-globals.d.ts",
    "webpack-defined-globals.d.ts",
    "/frontend/vendor/",
    "/locales/",
  ],
  transformIgnorePatterns: ["/node_modules/(?!@justfixnyc).+\\.js$"],
  watchPathIgnorePatterns: ["<rootDir>/frontend/lib/queries/__generated__/"],
  coverageReporters: ["lcov", "html"],
  coverageDirectory: "./coverage/jest/",
  testRegex: "((\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "\\.svg$": path.join(__dirname, "frontend", "mocks", "svg-mock.js"),
  },
  restoreMocks: true,
  setupFilesAfterEnv: ["./frontend/lib/tests/setup.ts"],
};
