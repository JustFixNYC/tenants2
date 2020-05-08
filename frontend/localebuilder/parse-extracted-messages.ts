import PO from "pofile";

export class ExtractedMessageCatalog {
  constructor(readonly msgidSourceFiles: Map<string, string[]>) {}
}

function getFilepath(reference: string) {
  const parts = reference.split(":");
  if (parts.length !== 2) {
    throw new Error(`"${reference}" is not a filepath:lineno pair!`);
  }
  return parts[0];
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

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
