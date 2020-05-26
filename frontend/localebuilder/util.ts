import fs from "fs";

export function readTextFileSync(path: string): string {
  return fs.readFileSync(path, {
    encoding: "utf-8",
  });
}

export function writeTextFileSync(path: string, content: string) {
  fs.writeFileSync(path, content, {
    encoding: "utf-8",
  });
}
