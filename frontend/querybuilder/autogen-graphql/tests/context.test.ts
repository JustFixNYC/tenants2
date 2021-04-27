import { AutogenContext } from "../context";
import { AutogenConfig, LATEST_AUTOGEN_CONFIG_VERSION } from "../config";
import { BEET_SCHEMA, BEET_TYPE, BEET_FIELDS } from "./util";
import { assertNotUndefined } from "@justfixnyc/util";

const EMPTY_AUTOGEN_CONFIG: AutogenConfig = {
  version: LATEST_AUTOGEN_CONFIG_VERSION,
  types: {},
};

function config(options: Partial<AutogenConfig>): AutogenConfig {
  return { ...EMPTY_AUTOGEN_CONFIG, ...options };
}

describe("AutogenContext", () => {
  it("works when there are no fragments", () => {
    const ctx = new AutogenContext(config({}), BEET_SCHEMA);
    expect(ctx.getFragmentName(BEET_TYPE)).toBeUndefined();
    expect([...ctx.iterFragmentTypes()]).toHaveLength(0);
  });

  it("works with named fragments", () => {
    const ctx = new AutogenContext(
      config({
        types: { Beet: { fragmentName: "AllBeetInfo" } },
      }),
      BEET_SCHEMA
    );

    expect(ctx.getFragmentName(BEET_TYPE)).toBe("AllBeetInfo");
    expect(
      [...ctx.iterFragmentTypes()].map((info) => info.fragmentName)
    ).toEqual(["AllBeetInfo"]);
  });

  it("ignores fields", () => {
    const ctx = new AutogenContext(
      config({
        types: { Beet: { ignoreFields: ["name"] } },
      }),
      BEET_SCHEMA
    );
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.name)).toBe(true);
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.weight)).toBe(false);
  });

  it("includes only specific fields", () => {
    const ctx = new AutogenContext(
      config({
        types: { Beet: { includeOnlyFields: ["name"] } },
      }),
      BEET_SCHEMA
    );
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.name)).toBe(false);
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.weight)).toBe(true);
  });

  it("globally ignores fields", () => {
    const ctx = new AutogenContext(
      config({
        ignoreFields: ["weight"],
      }),
      BEET_SCHEMA
    );
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.name)).toBe(false);
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.weight)).toBe(true);
  });

  it("raises exceptions when asked to ignore and include only specific fields", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            types: {
              Beet: {
                ignoreFields: ["hairstyle"],
                includeOnlyFields: ["hairstyle"],
              },
            },
          }),
          BEET_SCHEMA
        )
    ).toThrow(/ignore/);
  });

  it("raises exceptions on invalid include only fields", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            types: { Beet: { includeOnlyFields: ["hairstyle"] } },
          }),
          BEET_SCHEMA
        )
    ).toThrow('Field "hairstyle" does not exist on type "Beet".');
  });

  it("raises exceptions on invalid ignored fields", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            types: { Beet: { ignoreFields: ["hairstyle"] } },
          }),
          BEET_SCHEMA
        )
    ).toThrow('Field "hairstyle" does not exist on type "Beet".');
  });

  it("raises exceptions on invalid type names", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            types: { Hamburger: {} },
          }),
          BEET_SCHEMA
        )
    ).toThrow('"Hamburger" is not a valid GraphQL type.');
  });

  it("raises exceptions on invalid mutation names", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            mutations: { doFunkyThing: {} },
          }),
          BEET_SCHEMA
        )
    ).toThrow('"doFunkyThing" is not a valid mutation name.');
  });

  it("raises exceptions on invalid mutation regexps", () => {
    expect(
      () =>
        new AutogenContext(
          config({
            mutations: { "doFunky.*": {} },
          }),
          BEET_SCHEMA
        )
    ).toThrow('The pattern "doFunky.*" does not match any mutation names!');
  });

  it("works with mutations", () => {
    const ctx = new AutogenContext(
      config({
        mutations: { eat: {} },
      }),
      BEET_SCHEMA
    );
    const info = assertNotUndefined(ctx.mutationMap.get("eat"));
    expect(info.name).toBe("EatMutation");
    expect(info.inputArg.name).toBe("beetDeets");
    expect(info.fieldName).toBe("eat");
    expect(info.outputType.name).toBe("Beet");
    expect(info.inputObjectType.name).toBe("BeetInput");
  });

  it("allows mutations to be renamed", () => {
    const ctx = new AutogenContext(
      config({
        mutations: { eat: { name: "ConsumeMutation" } },
      }),
      BEET_SCHEMA
    );
    const info = assertNotUndefined(ctx.mutationMap.get("eat"));
    expect(info.name).toBe("ConsumeMutation");
  });
});
