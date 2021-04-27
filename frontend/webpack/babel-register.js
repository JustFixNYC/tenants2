//@ts-nocheck

const { nodeBabelOptions, excludeMostOfNodeModules } = require("./base");

require("@babel/register")({
  ...nodeBabelOptions,
  ignore: [excludeMostOfNodeModules],
  extensions: [".js", ".ts", ".tsx"],
});
