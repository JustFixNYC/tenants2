import fs from "fs";
import path from "path";
import { parseCompiledMessages } from "./parse-compiled-messages";
import { parseExtractedMessages } from "./parse-extracted-messages";
import {
  MessageCatalogSplitterChunkConfig,
  MessageCatalogSplitter,
} from "./message-catalog-splitter";
import {
  MessageCatalogPaths,
  getAllMessageCatalogPaths,
} from "./message-catalog-paths";
import { argvHasOption } from "../querybuilder/util";
import { checkExtractedMessagesSync } from "./check-extracted-messages";
import { assertNotUndefined } from "../lib/util/util";
import PO from "pofile";
import { garbleMessage, Garbler } from "./garble";

const MY_DIR = __dirname;

const LOCALES_DIR = path.resolve(path.join(MY_DIR, "..", "..", "locales"));

/**
 * Our default locale, which defines the canonical content of our
 * messages to be translated.
 */
const DEFAULT_LOCALE = "en";

/**
 * The command to run to extract messages from our source code and
 * regenerate PO files.
 */
const EXTRACT_CMD = "yarn lingui:extract clean";

/**
 * The maximum preferred length of a message id.
 */
const MAX_ID_LENGTH = 175;

/**
 * This encapsulates our criteria for splitting up Lingui's
 * single message catalog into separate individual "chunks".
 */
const SPLIT_CHUNK_CONFIGS: MessageCatalogSplitterChunkConfig[] = [
  /**
   * Any strings that are *only* present in the norent directory
   * will go into their own chunk.
   */
  {
    name: "norent",
    test: (s) => s.startsWith("frontend/lib/norent/"),
  },
  /**
   * Everything else goes into a separate chunk.
   */
  {
    name: "base",
    test: (s) => true,
  },
];

function readTextFileSync(path: string): string {
  return fs.readFileSync(path, {
    encoding: "utf-8",
  });
}

/**
 * Split up the message catalog for a single locale.
 */
function processLocale(paths: MessageCatalogPaths, validate: boolean) {
  console.log(`Processing locale '${paths.locale}'.`);

  const messagesJs = readTextFileSync(paths.js);
  const compiled = parseCompiledMessages(messagesJs);
  const messagesPo = readTextFileSync(paths.po);
  var extracted = parseExtractedMessages(messagesPo);
  if (validate) {
    extracted.validateIdLengths(MAX_ID_LENGTH);
  }
  const splitter = new MessageCatalogSplitter(extracted, compiled, {
    locale: paths.locale,
    rootDir: paths.rootDir,
    chunks: SPLIT_CHUNK_CONFIGS,
  });
  splitter.split();
}

const defaultGarbler: Garbler = (text) => {
  return text.replace(/[A-Za-z]/g, '?');
};

function garbleMessageCatalogs(
  allPaths: MessageCatalogPaths[],
  defaultPaths: MessageCatalogPaths,
  garbler: Garbler = defaultGarbler
) {
  const defaultPo = PO.parse(readTextFileSync(defaultPaths.po));
  const sources = new Map<string, string>();

  for (let item of defaultPo.items) {
    sources.set(item.msgid, garbleMessage(garbler, item.msgstr.join("")));
  }

  for (let paths of allPaths) {
    if (paths === defaultPaths) continue;
    const localePo = PO.parse(readTextFileSync(paths.po));

    for (let item of localePo.items) {
      const garbled = sources.get(item.msgid);
      if (!garbled) {
        throw new Error(
          `${defaultPaths.locale} source not found for msgid "${item.msgid}"!`
        );
      }
      item.msgstr = [garbled];
    }

    console.log(`Garbling ${paths.po}.`);
    fs.writeFileSync(paths.po, localePo.toString(), { encoding: 'utf-8'});
  }
}

/**
 * Main function to run the localebuilder CLI.
 */
export function run() {
  if (argvHasOption("-h", "--help")) {
    console.log(`usage: ${process.argv[1]} [OPTIONS]`);
    console.log(`options:\n`);
    console.log("  --check         Ensure PO files are up to date");
    console.log("  --garble        Enact gobbledygook translation");
    console.log("  -h / --help     Show this help");
    console.log("  -v / --version  Show the version number");
    process.exit(0);
  }

  const allPaths = getAllMessageCatalogPaths(LOCALES_DIR);
  const defaultPath = allPaths.filter(
    (path) => path.locale === DEFAULT_LOCALE
  )[0];

  assertNotUndefined(defaultPath);

  if (argvHasOption("--check")) {
    checkExtractedMessagesSync(defaultPath.po, EXTRACT_CMD);
    process.exit(0);
  }

  if (argvHasOption("--garble")) {
    garbleMessageCatalogs(allPaths, defaultPath);
    process.exit(0);
  }

  let validate = true;
  for (let paths of allPaths) {
    processLocale(paths, validate);
    validate = false;
  }
}
