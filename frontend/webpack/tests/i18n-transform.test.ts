import * as babel from "@babel/core";
import { I18nTransformOptions } from "../i18n-transform-types";
import * as fsPath from 'path';

const I18N_PATH = JSON.stringify(fsPath.normalize(fsPath.join(__dirname, '..', '..', 'lib', 'i18n.tsx')));

function transform(code: string, options: I18nTransformOptions = {}): string {
  const result = babel.transform(code, {
    plugins: [
      '@babel/plugin-syntax-jsx',
      [`${__dirname}/../i18n-transform.js`, options]
    ]
  });
  return (result && result.code) || '';
}

describe("Babel i18n transform", () => {
  it("should do nothing if disabled", () => {
    expect(transform('<p>hi</p>;')).toEqual('<p>hi</p>;');
  });

  it("should uppercase", () => {
    expect(transform('<p>hi</p>;', {
      uppercase: true
    })).toEqual('<p>HI</p>;');
  });

  it("should replace with i18n function call", () => {
    expect(transform('<p>hi</p>;', {
      func: true
    })).toEqual(
      `var i18n = require(${I18N_PATH}).i18n;\n\n<p>{i18n("hi", "p")}</p>;`
    );
  });
});
