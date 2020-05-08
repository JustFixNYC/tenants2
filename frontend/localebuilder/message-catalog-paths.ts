import fs from "fs";
import path from "path";

export type MessageCatalogPaths = {
  locale: string;
  rootDir: string;
  js: string;
  po: string;
};

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
    if (fs.existsSync(js) && fs.existsSync(po)) {
      result.push({ locale: filename, rootDir: abspath, js, po });
    }
  });

  return result;
}
