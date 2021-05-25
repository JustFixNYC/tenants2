import { argvHasOption } from "../querybuilder/util";
import ourConfig from "../../common-data/config";
import { createCommonDataFiles } from "./commondatabuilder";

const VERSION = "0.1.0";

export function run() {
  if (argvHasOption("-h", "--help")) {
    console.log(`usage: ${process.argv[1]} [OPTIONS]\n`);
    console.log(`options:\n`);
    console.log("  -h / --help     Show this help");
    console.log("  -v / --version  Show the version number");
    process.exit(0);
  }

  if (argvHasOption("-v", "--version")) {
    console.log(`commondatabuilder version ${VERSION}`);
    process.exit(0);
  }

  createCommonDataFiles(ourConfig);
}
