/**
 * @typedef {import("webpack").Compiler} WebpackCompiler
 */

const http = require("http");

class NotifyServerOfNewBuildPlugin {
  /**
   * During watch mode, this webpack plugin notifies a server of a new build
   * by pinging it via HTTP GET. It does nothing outside of watch mode.
   *
   * @argument url {string|undefined} The URL to ping when resources are
   *   emitted. If empty or undefined, the plugin will do nothing.
   */
  constructor(url) {
    this.url = url;
    this.isInWatchMode = false;
  }

  /**
   * @argument compiler {WebpackCompiler}
   */
  apply(compiler) {
    const url = this.url;
    if (!url) return;
    const myName = this.constructor.name;
    compiler.hooks.watchRun.tap(myName, () => {
      this.isInWatchMode = true;
    });
    compiler.hooks.afterEmit.tap(myName, () => {
      if (!this.isInWatchMode) return;
      const req = http.get(url, (res) => res.destroy());
      req.on("error", (e) => {
        console.log(`Error notifying ${url} of new build: ${e}`);
      });
      req.end();
    });
  }
}

module.exports = NotifyServerOfNewBuildPlugin;
