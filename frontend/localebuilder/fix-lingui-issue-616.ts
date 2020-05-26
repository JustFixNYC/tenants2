import { MessageCatalogPaths } from "./message-catalog-paths";
import PO from "pofile";
import { readTextFileSync, writeTextFileSync } from "./util";

export function fixLinguiIssue616Sync(defaultPaths: MessageCatalogPaths) {
  const poMessages = PO.parse(readTextFileSync(defaultPaths.po));
  let numFixed = 0;
  for (let item of poMessages.items) {
    if (!item.msgstr.length) {
      numFixed++;
      item.msgstr.push(item.msgid);
    }
  }
  if (numFixed > 0) {
    console.log(`Fixed lingui/js-lingui#616 for ${numFixed} entries.`);
    writeTextFileSync(defaultPaths.po, poMessages.toString());
  }
}
