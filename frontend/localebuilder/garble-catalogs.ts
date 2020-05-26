import { Garbler, garbleMessage } from "./garble";
import { MessageCatalogPaths } from "./message-catalog-paths";
import PO from "pofile";
import { readTextFileSync, writeTextFileSync } from "./util";

const garbler: Garbler = (text) => {
  return text.replace(/[A-Za-z]/g, "?");
};

function getGarbledLinguiSources(poPath: string): Map<string, string> {
  const defaultPo = PO.parse(readTextFileSync(poPath));
  const sources = new Map<string, string>();

  for (let item of defaultPo.items) {
    sources.set(item.msgid, garbleMessage(garbler, item.msgstr.join("")));
  }

  return sources;
}

function garbleLinguiSources(
  poPath: string,
  garbledSources: Map<string, string>
) {
  const localePo = PO.parse(readTextFileSync(poPath));

  console.log(`Garbling ${poPath}.`);

  for (let item of localePo.items) {
    const garbled = garbledSources.get(item.msgid);
    if (!garbled) {
      throw new Error(
        `Source not found for msgid "${item.msgid}" in ${poPath}!`
      );
    }
    item.msgstr = [garbled];
  }

  writeTextFileSync(poPath, localePo.toString());
}

function garbleDjangoSources(poPath: string) {
  console.log(`Garbling ${poPath}`);
  const djangoPo = PO.parse(readTextFileSync(poPath));

  for (let item of djangoPo.items) {
    const garbled = garbleMessage(garbler, item.msgid);
    item.msgstr = [garbled];
  }

  writeTextFileSync(poPath, djangoPo.toString());
}

export function garbleMessageCatalogs(
  allPaths: MessageCatalogPaths[],
  defaultPaths: MessageCatalogPaths
) {
  const sources = getGarbledLinguiSources(defaultPaths.po);

  for (let paths of allPaths) {
    if (paths === defaultPaths) continue;
    garbleLinguiSources(paths.po, sources);
    garbleDjangoSources(paths.djangoPo);
  }
}
