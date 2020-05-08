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

  constructor() {
    this.babelPlugin = this.babelPlugin.bind(this);
  }

  static parse(js: string): LinguiMessageCatalog {
    const lmcp = new LinguiMessageCatalogParser();
    babel.transformSync(js, {
      plugins: [lmcp.babelPlugin],
    });
    const { languageData, messages } = lmcp;
    if (!languageData) {
      throw new Error("languageData not found!");
    }
    return new LinguiMessageCatalog(languageData, messages);
  }

  visitTopLevelProperty(t: typeof babel.types, property: babel.types.Property) {
    if (t.isIdentifier(property.key)) {
      const { name } = property.key;
      const { value } = property;
      if (name === "languageData") {
        if (t.isObjectExpression(value)) {
          this.languageData = value;
        }
      } else if (name === "messages") {
        if (t.isObjectExpression(value)) {
          for (let property of value.properties) {
            if (t.isProperty(property)) {
              if (t.isStringLiteral(property.key)) {
                this.messages.set(property.key.value, property.value);
              }
            }
          }
        }
      }
    }
  }

  babelPlugin({ types: t }: { types: typeof babel.types }): babel.PluginObj {
    const self = this;

    return {
      visitor: {
        Program(path) {
          for (let statement of path.node.body) {
            if (t.isExpressionStatement(statement)) {
              const { expression } = statement;
              if (t.isAssignmentExpression(expression)) {
                if (t.isObjectExpression(expression.right)) {
                  for (let property of expression.right.properties) {
                    if (t.isProperty(property)) {
                      self.visitTopLevelProperty(t, property);
                    }
                  }
                }
              }
            }
          }
        },
      },
    };
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
