import * as babel from "@babel/core";

class CompiledMessageCatalog {
  constructor(
    readonly languageData: babel.types.ObjectExpression,
    readonly messages: Map<string, babel.types.Node>
  ) {}
}

class CompiledMessageCatalogParser {
  languageData: babel.types.ObjectExpression | null = null;
  messages: Map<string, babel.types.Node> = new Map();
  t: typeof babel.types = babel.types;

  private constructor(js: string) {
    const file = babel.parseSync(js);
    if (file && file.type === "File") {
      this.visitProgram(file.program);
    }
  }

  static parse(js: string): CompiledMessageCatalog {
    const lmcp = new CompiledMessageCatalogParser(js);
    const { languageData, messages } = lmcp;
    if (!languageData) {
      throw new Error("languageData not found!");
    }
    return new CompiledMessageCatalog(languageData, messages);
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

export function parseCompiledMessages(js: string): CompiledMessageCatalog {
  return CompiledMessageCatalogParser.parse(js);
}
