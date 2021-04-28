declare module "webpack-node-externals" {
  function nodeExternals(options: { allowlist: RegExp }): any;

  export = nodeExternals;
}
