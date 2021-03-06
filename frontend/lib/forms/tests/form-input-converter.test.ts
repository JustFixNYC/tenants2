import {
  FormInputConverter,
  getInitialFormInput,
} from "../form-input-converter";

describe("nullsToBools()", () => {
  it("raises error when property is not a boolean", () => {
    const conv = new FormInputConverter({ boop: "hi" } as any);
    expect(() => conv.nullsToBools(false, "boop")).toThrowError(
      "Expected key 'boop' to be a boolean or null, but it is string"
    );
  });

  it("works when default is false", () => {
    const conv = new FormInputConverter({ blah: true, oof: null, boof: null });
    const converted = conv.nullsToBools(false, "blah", "oof").data;
    const expected: typeof converted = { blah: true, oof: false, boof: null };
    expect(converted).toEqual(expected);
  });

  it("works when default is true", () => {
    const conv = new FormInputConverter({ blah: true, oof: null, boof: null });
    const converted = conv.nullsToBools(true, "blah", "oof").data;
    const expected: typeof converted = { blah: true, oof: true, boof: null };
    expect(converted).toEqual(expected);
  });
});

describe("yesNoRadios()", () => {
  it("raises error when property is not a boolean", () => {
    const conv = new FormInputConverter({ boop: "hi" } as any);
    expect(() => conv.yesNoRadios("boop")).toThrowError(
      "Expected key 'boop' to be a boolean or null, but it is string"
    );
  });

  it("works", () => {
    const conv = new FormInputConverter({
      blah: true,
      meh: false,
      glorp: false,
      oof: null,
    });
    const converted = conv.yesNoRadios("blah", "glorp", "oof").data;
    const expected: typeof converted = {
      blah: "True",
      meh: false,
      glorp: "False",
      oof: "",
    };
    expect(converted).toEqual(expected);
  });
});

describe("finish()", () => {
  it("works", () => {
    const conv = new FormInputConverter({ hi: 3, there: false, buddy: null });
    const converted = conv.finish();
    const expected: typeof converted = { hi: "3", there: false, buddy: "" };
    expect(converted).toEqual(expected);
  });
});

describe("getInitialFormInput()", () => {
  it("works", () => {
    const from = {
      hi: 3,
      there: true,
      extra: "hmm",
    };
    const defaultValue = {
      hi: "",
      there: false,
    };
    const to = {
      hi: "3",
      there: true,
    };
    expect(
      getInitialFormInput(from, defaultValue, (conv) => conv.finish())
    ).toEqual(to);
  });
});
