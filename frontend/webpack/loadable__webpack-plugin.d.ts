declare module "@loadable/webpack-plugin" {
  import { WebpackPluginInstance, Compiler } from "webpack";

  // https://www.smooth-code.com/open-source/loadable-components/docs/api-loadable-webpack-plugin/
  class LoadablePlugin implements WebpackPluginInstance {
    constructor(options?: {
      filename?: string;
      writeToDisk?: boolean | { filename: string };
    });

    apply: (compiler: Compiler) => void;
  }

  export = LoadablePlugin;
}
