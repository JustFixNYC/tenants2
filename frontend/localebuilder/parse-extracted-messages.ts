import PO from "pofile";
import chalk from "chalk";

/**
 * Encapsulates information about a Lingui extracted message
 * catalog.
 */
export class ExtractedMessageCatalog {
  constructor(
    /**
     * A mapping from message IDs to list of source files
     * the message resides in.
     */
    readonly msgidSourceFiles: Map<string, string[]>
  ) {}

  validateIdLengths(maxLength: number) {
    let numViolations = 0;
    for (let [id, sources] of this.msgidSourceFiles.entries()) {
      if (id.length > maxLength) {
        const EXCERPT_LEN = 30;
        const excerpt = JSON.stringify(id.substring(0, EXCERPT_LEN));
        const { length } = id;

        // The id would actually take up 2x the space in our bundle because
        // it will be used in the source code to reference an entry in
        // the JS locale bundle.
        const bundleSize = length * 2;

        console.warn(
          `Message id beginning with ${chalk.whiteBright(
            excerpt
          )} is ${chalk.redBright(length.toString())} characters.`
        );
        console.warn(`This message is found in ${chalk.yellow(sources[0])}.`);
        console.warn(
          `Due to its size, this id would actually consume around ` +
            `${bundleSize} bytes in our source code. Please shorten it!`
        );
        numViolations += 1;
      }
    }
    if (numViolations > 0) {
      throw new Error(
        `${numViolations} message(s) are longer than ${maxLength} characters!`
      );
    }
  }
}

/**
 * Takes a PO file reference (e.g. '/foo/bar/blarg.tsx:23')
 * and returns only the filename portion of it (e.g. '/foo/bar/blarg.tsx').
 */
function getFilepath(reference: string) {
  const parts = reference.split(":");
  if (parts.length !== 2) {
    throw new Error(`"${reference}" is not a filepath:lineno pair!`);
  }
  return parts[0];
}

/**
 * Removes any duplicate values in the array.
 */
function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/**
 * Parse information about the given PO source code.
 */
export function parseExtractedMessages(
  poText: string
): ExtractedMessageCatalog {
  var po = PO.parse(poText);
  const msgidSourceFiles: Map<string, string[]> = new Map();
  for (let item of po.items) {
    const filepaths = unique(item.references.map(getFilepath));
    msgidSourceFiles.set(item.msgid, filepaths);
  }
  return new ExtractedMessageCatalog(msgidSourceFiles);
}
