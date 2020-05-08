import fs from "fs";
import PO from "pofile";
import generate from "@babel/generator";
import { parseCompiledMessages } from "./parse-compiled-messages";

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

export function run() {
  const messagesJs = fs.readFileSync("locales/es/messages.js", {
    encoding: "utf-8",
  });
  const mc = parseCompiledMessages(messagesJs);
  const src = generate(mc.languageData);
  console.log("languageData is", src.code);
  for (let [message, value] of mc.messages) {
    const src = generate(value);
    console.log(message, "is", src.code);
  }
  const messagesPo = fs.readFileSync("locales/es/messages.po", {
    encoding: "utf-8",
  });
  var po = PO.parse(messagesPo);
  for (let item of po.items) {
    const filepaths = unique(item.references.map(getFilepath));
    console.log(item.msgid, filepaths.join(", "));
    if (!mc.messages.has(item.msgid)) {
      throw new Error(
        `JS message catalog does not contain msgid ${JSON.stringify(
          item.msgid
        )}`
      );
    }
  }
}
