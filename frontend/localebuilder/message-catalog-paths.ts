import fs from "fs";
import path from "path";

/**
 * Represents information about filesystem
 * paths to a particular locale's message catalog.
 */
export type MessageCatalogPaths = {
  /** The locale this object represents (e.g. 'en'). */
  locale: string;

  /**
   * The root directory where the locale's catalog
   * is kept (e.g. '/foo/en`).
   */
  rootDir: string;

  /**
   * The absolute path to the compiled message catalog
   * (JavaScript) for the locale.
   */
  js: string;

  /**
   * The absolute path to the extracted message catalog
   * (PO) for the locale.
   */
  po: string;

  /**
   * The absolute path to the extracted Django message catalog
   * (PO) for the locale.
   */
  djangoPo: string;
};

/**
 * Given a root directory where all locale data lives,
 * returns a list of path information about every locale.
 */
export function getAllMessageCatalogPaths(
  rootDir: string
): MessageCatalogPaths[] {
  const result: MessageCatalogPaths[] = [];

  fs.readdirSync(rootDir).forEach((filename) => {
    if (/^[._]/.test(filename)) return;
    const abspath = path.join(rootDir, filename);
    const stat = fs.statSync(abspath);
    if (!stat.isDirectory()) return;
    const js = path.join(abspath, "messages.js");
    const po = path.join(abspath, "messages.po");
    const djangoPo = path.join(abspath, "LC_MESSAGES", "django.po");
    if (fs.existsSync(js) && fs.existsSync(po)) {
      result.push({ locale: filename, rootDir: abspath, js, po, djangoPo });
    }
  });

  return result;
}
