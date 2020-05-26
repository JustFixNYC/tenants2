import fs from "fs";
import path from "path";
import { MessageCatalogPaths } from "./message-catalog-paths";
import { readTextFileSync, writeTextFileSync, readPoFileSync } from "./util";
import chalk from "chalk";

type IDMap = Map<string, string>;

function readIdMapSync(filename: string): IDMap {
  if (!fs.existsSync(filename)) return new Map();
  return new Map(JSON.parse(readTextFileSync(filename)));
}

function getEntriesSortedByKey(map: IDMap): [string, string][] {
  const entries = Array.from(map.entries());
  entries.sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
  return entries;
}

function writeIdMapSync(filename: string, map: IDMap) {
  writeTextFileSync(
    filename,
    JSON.stringify(getEntriesSortedByKey(map), null, 2) + "\n"
  );
}

export function checkMessageIdsSync(
  paths: MessageCatalogPaths,
  writeChanges: boolean
): number {
  const po = readPoFileSync(paths.po);
  const idMapPath = path.join(paths.rootDir, "check-ids.json");
  const relPath = path.relative(paths.rootDir, idMapPath);

  console.log(`Reading ${relPath}.`);
  const map = readIdMapSync(idMapPath);

  let errorsFound = 0;
  let messageIdsFound = 0;

  for (let item of po.items) {
    const msgstr = item.msgstr.join("");
    if (item.msgid !== msgstr) {
      // The message ID isn't the same as the message string, which means
      // this is a "coded" message ID that has been made shorter, to
      // e.g. reduce our bundle size.
      messageIdsFound++;
      if (!map.has(item.msgid)) {
        if (!writeChanges) {
          console.log(`${chalk.redBright(item.msgid)} is not in ${relPath}!`);
          errorsFound++;
        }
        map.set(item.msgid, msgstr);
      }
      if (map.get(item.msgid) !== msgstr) {
        console.log(
          `${chalk.redBright(
            item.msgid
          )} has changed! Please change the message ID to ` +
            `something unique, e.g. by adding a version number to the end, ` +
            `or remove its entry from ${relPath}.`
        );
        errorsFound++;
      }
    }
  }

  console.log(
    `${messageIdsFound} message ID codes found, ${errorsFound} errors.`
  );

  if (writeChanges) {
    console.log(`Writing ${relPath}.`);
    writeIdMapSync(idMapPath, map);
  }

  return errorsFound;
}
