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

const MY_DIR = __dirname;

const LOCALES_DIR = path.resolve(path.join(MY_DIR, "..", "..", "locales"));

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

/**
 * Split up the message catalog for a single locale.
 */
function processLocale(paths: MessageCatalogPaths, validate: boolean) {
  console.log(`Processing locale '${paths.locale}'.`);

  const messagesJs = fs.readFileSync(paths.js, {
    encoding: "utf-8",
  });
  const compiled = parseCompiledMessages(messagesJs);
  const messagesPo = fs.readFileSync(paths.po, {
    encoding: "utf-8",
  });
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

/**
 * Main function to run the localebuilder CLI.
 */
export function run() {
  const allPaths = getAllMessageCatalogPaths(LOCALES_DIR);
  let validate = true;
  for (let paths of allPaths) {
    processLocale(paths, validate);
    validate = false;
  }
}
