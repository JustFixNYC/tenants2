declare module "webpack-node-externals" {
  function nodeExternals(options: {
    allowlist: RegExp[];
    additionalModuleDirs: string[];
  }): any;

  export = nodeExternals;
}
