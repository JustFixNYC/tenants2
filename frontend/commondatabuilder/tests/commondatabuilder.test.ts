import * as fs from "fs";

import {
  createDjangoChoicesTypescript,
  createCommonDataFiles,
  getDjangoChoiceLabel,
  validateDjangoChoices,
  filterDjangoChoices,
} from "../commondatabuilder";
import ourConfig from "../../../common-data/config";
import { DjangoChoices } from "../../lib/common-data";

describe("commondatabuilder", () => {
  it("creates django choice typescript", () => {
    const ts = createDjangoChoicesTypescript(
      [["BROOKLYN", "Brooklyn"]],
      "BoroughChoice"
    );
    expect(ts).toMatchSnapshot();
  });

  it("only exports labels if configured to", () => {
    expect(createDjangoChoicesTypescript([], "Foo")).toMatch(/getFooLabels/);
    expect(
      createDjangoChoicesTypescript([], "Foo", {
        exportLabels: false,
      })
    ).not.toMatch(/getFooLabels/);
  });

  it("only internationalizes labels if configured to", () => {
    expect(
      createDjangoChoicesTypescript([], "Foo", {
        exportLabels: true,
      })
    ).not.toMatch(/lingui/);
    const ts = createDjangoChoicesTypescript(
      [["THINGY", "I am thingy"]],
      "Foo",
      {
        exportLabels: true,
        internationalizeLabels: true,
      }
    );
    expect(ts).toMatch(/lingui/);
    expect(ts).toMatchSnapshot();
  });
});

it("current common data JSON files are synced with TS files", () => {
  const files = createCommonDataFiles(ourConfig, true);
  files.forEach(({ ts, tsPath }) => {
    const currentTs = fs.readFileSync(tsPath, { encoding: "utf-8" });
    if (currentTs !== ts) {
      throw new Error(
        'Common data has changed, please re-run "node commondatabuilder.js".'
      );
    }
  });
});

test("getDjangoChoiceLabel() works", () => {
  expect(getDjangoChoiceLabel([["BLAH", "boop"]], "BLAH")).toBe("boop");
  expect(() => getDjangoChoiceLabel([["BLAH", "boop"]], "NOPE")).toThrow(
    "Unable to find label for value NOPE"
  );
});

test("validateDjangoChoices() works", () => {
  expect(validateDjangoChoices([["BLAH", "boop"]], ["BLAH"])).toBeUndefined();
  expect(() => validateDjangoChoices([["BLAH", "boop"]], ["NOPE"])).toThrow(
    "Unable to find label for value NOPE"
  );
});

test("filterDjangoChoices() works", () => {
  const choices: DjangoChoices = [
    ["FOO", "Foo"],
    ["BAR", "Bar"],
  ];
  expect(filterDjangoChoices(choices, ["FOO"])).toEqual([["BAR", "Bar"]]);
  expect(filterDjangoChoices(choices, /^BA/)).toEqual([["FOO", "Foo"]]);
});
