import fs from "fs";
import generate from "@babel/generator";
import { parseCompiledMessages } from "./parse-compiled-messages";
import { parseExtractedMessages } from "./parse-extracted-messages";

export function run() {
  const messagesJs = fs.readFileSync("locales/es/messages.js", {
    encoding: "utf-8",
  });
  const compiled = parseCompiledMessages(messagesJs);
  const src = generate(compiled.languageData);
  console.log("languageData is", src.code);
  for (let [message, value] of compiled.messages) {
    const src = generate(value);
    console.log(message, "is", src.code);
  }
  const messagesPo = fs.readFileSync("locales/es/messages.po", {
    encoding: "utf-8",
  });
  var extracted = parseExtractedMessages(messagesPo);
  for (let [msgid, sourceFiles] of extracted.msgidSourceFiles) {
    console.log(msgid, sourceFiles.join(", "));
    if (!compiled.messages.has(msgid)) {
      throw new Error(
        `JS message catalog does not contain msgid ${JSON.stringify(msgid)}`
      );
    }
  }
}
