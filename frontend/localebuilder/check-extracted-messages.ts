import fs from "fs";
import path from "path";
import childProcess from "child_process";
import PO from "pofile";
import { isDeepEqual } from "../lib/util/util";
import chalk from "chalk";

function getPoMessages(poText: string) {
  const po = PO.parse(poText);
  const obj: { [key: string]: string } = {};
  for (let item of po.items) {
    obj[item.msgid] = item.msgstr.join("");
  }
  return obj;
}

export function checkExtractedMessagesSync(poPath: string, extractCmd: string) {
  const readPoSync = () =>
    getPoMessages(fs.readFileSync(poPath, { encoding: "utf-8" }));
  const relPath = path.relative(process.cwd(), poPath);
  console.log(`Reading ${relPath}.`);
  const origPo = readPoSync();
  console.log(`Running "${extractCmd}"...`);
  childProcess.execSync(extractCmd);
  console.log(`Reading ${relPath} again.`);
  const newestPo = readPoSync();
  if (!isDeepEqual(origPo, newestPo)) {
    console.log(
      chalk.redBright(
        `Extracted message catalogs are out of date! ` +
          `Please re-run "${extractCmd}", or commit the changes to .po ` +
          `files that have just been made on this machine.`
      )
    );
    process.exit(1);
  }
  console.log("Extracted message catalogs are up to date.");
}
