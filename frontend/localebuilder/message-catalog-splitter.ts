import fs from "fs";
import path from "path";
import generate from "@babel/generator";
import { ExtractedMessageCatalog } from "./parse-extracted-messages";
import { CompiledMessageCatalog } from "./parse-compiled-messages";

/**
 * A function that, given a source file, returns whether
 * it is considered part of a chunk of a particular
 * message catalog.
 */
type SplitChunkTestFunc = (sourceFile: string) => boolean;

/**
 * Encapsulates information about a message catalog chunk.
 */
export type MessageCatalogSplitterChunkConfig = {
  /**
   * The name of the chunk; should consist of characters
   * that are valid in a filename, preferably without spaces.
   */
  name: string;

  /**
   * A function to test whether a file path can be considered
   * part of the chunk.
   */
  test: SplitChunkTestFunc;
};

/**
 * Configuration for a message catalog splitter.
 */
export type MessageCatalogSplitterConfig = {
  /** Locale whose catalog we're splitting (e.g. 'en'). */
  locale: string;

  /**
   * Root directory of the locale, where we'll write the
   * chunked catalogs into.
   */
  rootDir: string;

  /**
   * List of chunked catalogs to write.
   */
  chunks: MessageCatalogSplitterChunkConfig[];
};

type CompiledMessage = { msgid: string; node: babel.types.Node };

/**
 * A class responsible for splitting a single message catalog
 * into separate chunks.
 */
export class MessageCatalogSplitter {
  chunks: Map<string, CompiledMessage[]> = new Map();

  constructor(
    /** The extracted message catalog (PO file). */
    readonly extracted: ExtractedMessageCatalog,

    /** The compiled message catalog (JS file). */
    readonly compiled: CompiledMessageCatalog,

    /**
     * Configuration for splitting the message catalog
     * into multiple chunks.
     */
    readonly config: MessageCatalogSplitterConfig
  ) {}

  /**
   * Write the individual chunked catalogs.
   */
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
      // Note that we'll only put the file into a chunk if *every*
      // source file it's present in is in the same chunk.
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
