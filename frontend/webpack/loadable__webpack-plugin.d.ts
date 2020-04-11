declare module "@loadable/webpack-plugin" {
  import { Plugin } from "webpack";

  // https://www.smooth-code.com/open-source/loadable-components/docs/api-loadable-webpack-plugin/
  class LoadablePlugin extends Plugin {
    constructor(options?: {
      filename?: string;
      writeToDisk?: boolean | { filename: string };
    });
  }

  export = LoadablePlugin;
}
