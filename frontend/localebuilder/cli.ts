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
import { assertNotUndefined } from "@justfixnyc/util";
import { garbleMessageCatalogs } from "./garble-catalogs";
import { readTextFileSync } from "./util";
import { fixLinguiIssue616Sync } from "./fix-lingui-issue-616";

const MY_DIR = __dirname;

const LOCALES_DIR = path.resolve(path.join(MY_DIR, "..", "..", "locales"));

/**
 * Our default locale, which defines the canonical content of our
 * messages to be translated.
 */
const DEFAULT_LOCALE = "en";

/**
 * The command to run to extract messages from our front-end source code and
 * regenerate PO files.
 */
const FRONTEND_EXTRACT_CMD = "yarn lingui:extract";

/**
 * The command to run to extract messages from our front-end source code and
 * regenerate PO files.
 */
const BACKEND_EXTRACT_CMD = "yarn django:makemessages";

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
   * Any strings that are *only* present in the evictionfree directory
   * will go into their own chunk.
   */
  {
    name: "evictionfree",
    test: (s) => s.startsWith("frontend/lib/evictionfree/"),
  },
  /**
   * Any strings that are *only* present in the laletterbuilder directory
   * will go into their own chunk.
   */
  {
    name: "laletterbuilder",
    test: (s) => s.startsWith("frontend/lib/laletterbuilder/"),
  },
  /**
   * Any strings that are *only* present in the rh directory
   * will go into their own chunk.
   */
  {
    name: "rh",
    test: (s) => s.startsWith("frontend/lib/rh/"),
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
  if (argvHasOption("-h", "--help")) {
    console.log(`usage: ${process.argv[1]} [OPTIONS]`);
    console.log(`options:\n`);
    console.log("  --check         Ensure PO files are up to date");
    console.log("  --garble        Enact gobbledygook translation");
    console.log("  --fix-616       Fix Lingui issue #616");
    console.log("  -h / --help     Show this help");
    console.log("  -v / --version  Show the version number");
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

  if (argvHasOption("--check")) {
    checkExtractedMessagesSync(defaultPath.djangoPo, BACKEND_EXTRACT_CMD);
    checkExtractedMessagesSync(defaultPath.po, FRONTEND_EXTRACT_CMD);
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
