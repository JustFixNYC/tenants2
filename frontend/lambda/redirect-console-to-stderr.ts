import { Console } from "console";

/* istanbul ignore next: this is tested by integration tests. */
// We don't want to redirect the console to stderr when running
// tests because they will mess up logging output.
if (typeof (global as any).describe !== "function") {
  Object.defineProperty(global, "console", {
    value: new Console(process.stderr),
  });
}
