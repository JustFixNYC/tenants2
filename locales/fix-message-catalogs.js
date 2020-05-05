//@ts-check

/**
 * There doesn't seem to be any easy way to have TypeScript
 * ignore first-party code that is explicitly imported by
 * code that is type-checked, so this script goes through
 * all lingui's messages catalog JS files and explicitly
 * tells TypeScript to ignore them.
 */
const fs = require("fs");
const path = require("path");

const LOCALES_DIR = __dirname;
const PREPEND = "//@ts-nocheck\n";

/**
 * Ensure the given file has a '//@ts-nocheck' at the top.
 * If the file already has it, do nothing.
 *
 * @param {string} filename
 */
function mungeMessagesJs(filename) {
  const encoding = "utf-8";
  const contents = fs.readFileSync(filename, { encoding });

  if (contents.startsWith(PREPEND)) return;

  fs.writeFileSync(filename, PREPEND + contents, { encoding });
}

function main() {
  fs.readdirSync(LOCALES_DIR).forEach((filename) => {
    if (/^[._]/.test(filename)) return;
    const abspath = path.join(LOCALES_DIR, filename);
    const stat = fs.statSync(abspath);
    if (!stat.isDirectory()) return;
    const messagesJs = path.join(abspath, "messages.js");
    if (fs.existsSync(messagesJs)) {
      mungeMessagesJs(messagesJs);
    }
  });
}

if (module.parent === null) {
  main();
}
