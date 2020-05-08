import PO from "pofile";

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
