// @ts-check

const { execSync } = require("child_process");
const chokidar = require("chokidar");
const chalk = require("chalk");

const FILENAME = "safe-mode.js";

function uglify() {
  console.log(`Uglifying ${FILENAME}.`);
  try {
    execSync("yarn safe_mode_snippet", { stdio: "inherit" });
  } catch (e) {
    console.log(chalk.redBright(`Uglification failed!`));
  }
}

if (!module.parent) {
  console.log(`Waiting for changes to ${FILENAME}...`);
  chokidar
    .watch(`${__dirname}/${FILENAME}`, { awaitWriteFinish: true })
    .on("ready", uglify)
    .on("change", uglify);
}
