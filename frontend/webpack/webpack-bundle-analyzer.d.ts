declare module "webpack-bundle-analyzer" {
  import { WebpackPluginInstance, Compiler } from "webpack";

  /**
   * This is effectively a subset of the following third-party typings,
   * which cause type errors for us because they import their own
   * version of webpack which is somehow slightly different from ours:
   *
   * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/webpack-bundle-analyzer/index.d.ts
   */
  export class BundleAnalyzerPlugin implements WebpackPluginInstance {
    constructor(options?: {
      analyzerMode?: "server" | "static" | "json" | "disabled";
      openAnalyzer?: boolean;
    });

    apply(compiler: Compiler): void;
  }
}
