import { AutogenContext } from "../context";
import { AutogenConfig, LATEST_AUTOGEN_CONFIG_VERSION } from "../config";
import { BEET_SCHEMA, BEET_TYPE, BEET_FIELDS } from "./util";

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
    const ctx = new AutogenContext(config({
      types: { Beet: { fragmentName: 'AllBeetInfo' } }
    }), BEET_SCHEMA);

    expect(ctx.getFragmentName(BEET_TYPE)).toBe('AllBeetInfo');
    expect([...ctx.iterFragmentTypes()].map(info => info.fragmentName)).toEqual(['AllBeetInfo']);
  });

  it("ignores fields", () => {
    const ctx = new AutogenContext(config({
      types: { Beet: { ignoreFields: ['name'] } }
    }), BEET_SCHEMA);
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.name)).toBe(true);
    expect(ctx.shouldIgnoreField(BEET_TYPE, BEET_FIELDS.weight)).toBe(false);
  });

  it("raises exceptions on invalid ignored fields", () => {
    expect(() => new AutogenContext(config({
      types: { Beet: { ignoreFields: ['hairstyle'] } }
    }), BEET_SCHEMA)).toThrow('Field "hairstyle" does not exist on type "Beet".');
  });

  it("raises exceptions on invalid type names", () => {
    expect(() => new AutogenContext(config({
      types: { Hamburger: {} }
    }), BEET_SCHEMA)).toThrow('"Hamburger" is not a valid GraphQL type.');
  });
});
