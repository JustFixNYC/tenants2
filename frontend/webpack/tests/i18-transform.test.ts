import * as babel from "@babel/core";
import { I18nTransformOptions } from "../i18-transform-types";

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
});
