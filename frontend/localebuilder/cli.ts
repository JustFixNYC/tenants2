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
const SPLIT_CHUNK_CONFIGS: MessageCatalogSplitterChunkConfig[] = [
  {
    name: "norent",
    test: (s) => s.startsWith("frontend/lib/norent/"),
  },
  {
    name: "base",
    test: (s) => true,
  },
];

function processLocale(paths: MessageCatalogPaths) {
  console.log(`Processing locale '${paths.locale}'.`);

  const messagesJs = fs.readFileSync(paths.js, {
    encoding: "utf-8",
  });
  const compiled = parseCompiledMessages(messagesJs);
  const messagesPo = fs.readFileSync(paths.po, {
    encoding: "utf-8",
  });
  var extracted = parseExtractedMessages(messagesPo);
  const splitter = new MessageCatalogSplitter(extracted, compiled, {
    locale: paths.locale,
    rootDir: paths.rootDir,
    chunks: SPLIT_CHUNK_CONFIGS,
  });
  splitter.split();
}

export function run() {
  const allPaths = getAllMessageCatalogPaths(LOCALES_DIR);
  for (let paths of allPaths) {
    processLocale(paths);
  }
}
