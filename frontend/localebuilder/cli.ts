import fs from "fs";
import PO from "pofile";
import * as babel from "@babel/core";
import generate from "@babel/generator";

class LinguiMessageCatalog {
  constructor(
    readonly languageData: babel.types.ObjectExpression,
    readonly messages: Map<string, babel.types.Node>
  ) {}
}

class LinguiMessageCatalogParser {
  languageData: babel.types.ObjectExpression | null = null;
  messages: Map<string, babel.types.Node> = new Map();
  t: typeof babel.types = babel.types;

  private constructor(js: string) {
    const file = babel.parseSync(js);
    if (file && file.type === "File") {
      this.visitProgram(file.program);
    }
  }

  static parse(js: string): LinguiMessageCatalog {
    const lmcp = new LinguiMessageCatalogParser(js);
    const { languageData, messages } = lmcp;
    if (!languageData) {
      throw new Error("languageData not found!");
    }
    return new LinguiMessageCatalog(languageData, messages);
  }

  visitProgram(program: babel.types.Program) {
    for (let statement of program.body) {
      this.visitBodyStatement(statement);
    }
  }

  visitBodyStatement(statement: babel.types.Statement) {
    const { t } = this;
    if (
      t.isExpressionStatement(statement) &&
      t.isAssignmentExpression(statement.expression) &&
      t.isObjectExpression(statement.expression.right)
    ) {
      this.visitModuleExports(statement.expression.right);
    }
  }

  visitModuleExports(objectExpression: babel.types.ObjectExpression) {
    const { t } = this;
    for (let property of objectExpression.properties) {
      if (t.isProperty(property)) {
        this.visitModuleExport(property);
      }
    }
  }

  visitModuleExport(property: babel.types.Property) {
    const { t } = this;
    if (t.isIdentifier(property.key)) {
      const { name } = property.key;
      const { value } = property;
      if (name === "languageData") {
        this.visitLanguageDataExport(value);
      } else if (name === "messages") {
        this.visitMessagesExport(value);
      }
    }
  }

  visitLanguageDataExport(value: babel.types.Node | null) {
    if (this.t.isObjectExpression(value)) {
      this.languageData = value;
    }
  }

  visitMessagesExport(value: babel.types.Node | null) {
    const { t } = this;
    if (t.isObjectExpression(value)) {
      for (let property of value.properties) {
        this.visitMessageProperty(property);
      }
    }
  }

  visitMessageProperty(
    property:
      | babel.types.ObjectMethod
      | babel.types.ObjectProperty
      | babel.types.SpreadElement
  ) {
    const { t } = this;
    if (t.isProperty(property) && t.isStringLiteral(property.key)) {
      this.messages.set(property.key.value, property.value);
    }
  }
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

export function run() {
  const messagesJs = fs.readFileSync("locales/es/messages.js", {
    encoding: "utf-8",
  });
  const mc = LinguiMessageCatalogParser.parse(messagesJs);
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
