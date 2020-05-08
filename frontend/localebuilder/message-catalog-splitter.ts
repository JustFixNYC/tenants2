import fs from "fs";
import path from "path";
import generate from "@babel/generator";
import { ExtractedMessageCatalog } from "./parse-extracted-messages";
import { CompiledMessageCatalog } from "./parse-compiled-messages";

type SplitChunkTestFunc = (sourceFile: string) => boolean;

export type MessageCatalogSplitterChunkConfig = {
  name: string;
  test: SplitChunkTestFunc;
};

export type MessageCatalogSplitterConfig = {
  locale: string;
  rootDir: string;
  chunks: MessageCatalogSplitterChunkConfig[];
};

type CompiledMessage = { msgid: string; node: babel.types.Node };

export class MessageCatalogSplitter {
  chunks: Map<string, CompiledMessage[]> = new Map();

  constructor(
    readonly extracted: ExtractedMessageCatalog,
    readonly compiled: CompiledMessageCatalog,
    readonly config: MessageCatalogSplitterConfig
  ) {}

  split() {
    this.chunks.clear();

    for (let [msgid, sourceFiles] of this.extracted.msgidSourceFiles) {
      const node = this.compiled.messages.get(msgid);
      if (!node)
        throw new Error(
          `Compiled message catalog does not contain msgid ${JSON.stringify(
            msgid
          )}`
        );
      this.pushToChunk(msgid, sourceFiles, node);
    }
    this.writeChunks();
  }

  private pushToChunk(
    msgid: string,
    sourceFiles: string[],
    node: babel.types.Node
  ) {
    let foundChunk = false;
    for (let chunkConfig of this.config.chunks) {
      if (sourceFiles.every((s) => chunkConfig.test(s))) {
        this.pushChunkMessage(chunkConfig.name, { msgid, node });
        foundChunk = true;
        break;
      }
    }
    if (!foundChunk)
      throw new Error(`Unable to find chunk for msgid ${msgid}!`);
  }

  private writeChunks() {
    for (let chunkConfig of this.config.chunks) {
      const messages = this.chunks.get(chunkConfig.name) || [];
      const lines: string[] = [
        "// @ts-nocheck",
        "/* eslint-disable */",
        "module.exports = {",
      ];
      lines.push(
        `  languageData: ${generate(this.compiled.languageData).code},`
      );
      lines.push(`  messages: {`);
      for (let message of messages) {
        const key = JSON.stringify(message.msgid);
        const value = generate(message.node).code;
        lines.push(`    ${key}: ${value},`);
      }
      lines.push(`  },`);
      lines.push("};");
      const filename = `${chunkConfig.name}.chunk.js`;
      const relpath = `${this.config.locale}/${filename}`;
      const abspath = path.join(this.config.rootDir, filename);
      console.log(`Writing ${messages.length} messages to ${relpath}.`);
      fs.writeFileSync(abspath, lines.join("\n"));
    }
  }

  private pushChunkMessage(name: string, message: CompiledMessage) {
    let chunkMessages = this.chunks.get(name);
    if (!chunkMessages) {
      chunkMessages = [];
      this.chunks.set(name, chunkMessages);
    }
    chunkMessages.push(message);
  }
}
