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
import { extractAndCheckMessagesSync } from "./extract-and-check";
import { assertNotUndefined } from "../lib/util/util";
import { garbleMessageCatalogs } from "./garble-catalogs";
import { readTextFileSync } from "./util";
import { fixLinguiIssue616Sync } from "./fix-lingui-issue-616";
import { checkMessageIdsSync } from "./check-ids";

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
const EXTRACT_CMD = "yarn lingui:extract";

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

/**
 * Main function to run the localebuilder CLI.
 */
export function run() {
  const relPath = path.relative(process.cwd(), process.argv[1]);
  if (argvHasOption("-h", "--help")) {
    console.log(`usage: ${relPath} [OPTIONS]`);
    console.log(`options:\n`);
    console.log("  --extract-and-check  Ensure PO files are up to date");
    console.log("  --check-ids          Ensure PO message IDs are unique");
    console.log("  --garble             Enact gobbledygook translation");
    console.log("  --fix-616            Fix Lingui issue #616");
    console.log("  -h / --help          Show this help");
    process.exit(0);
  }

  const allPaths = getAllMessageCatalogPaths(LOCALES_DIR);
  const defaultPath = allPaths.filter(
    (path) => path.locale === DEFAULT_LOCALE
  )[0];

  assertNotUndefined(defaultPath);

  if (argvHasOption("--fix-616")) {
    fixLinguiIssue616Sync(defaultPath);
    process.exit(0);
  }

  if (argvHasOption("--extract-and-check")) {
    extractAndCheckMessagesSync(defaultPath.po, EXTRACT_CMD);
    process.exit(0);
  }

  if (argvHasOption("--garble")) {
    garbleMessageCatalogs(allPaths, defaultPath);
    process.exit(0);
  }

  if (argvHasOption("--check-ids")) {
    const errors = checkMessageIdsSync(defaultPath, argvHasOption("--write"));
    if (errors > 0) {
      console.log(
        `Once you fix the errors, run "node ${relPath} --check-ids --write".`
      );
    }
    process.exit(errors);
  }

  if (process.argv.length > 2) {
    console.log("Unknown options:", process.argv.slice(2));
    process.exit(1);
  }

  let validate = true;
  for (let paths of allPaths) {
    processLocale(paths, validate);
    validate = false;
  }
}
