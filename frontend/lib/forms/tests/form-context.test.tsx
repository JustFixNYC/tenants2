import { BaseFormContextOptions, FormContext } from "../form-context";

describe("FormContext", () => {
  const currentState = {
    foo: "hello",
    bar: 1,
    baz: [{ thing: 1 }],
  };
  const baseOptions: BaseFormContextOptions<typeof currentState> = {
    idPrefix: "blarg",
    isLoading: false,
    errors: undefined,
    currentState,
    setField(field, value) {},
    namePrefix: "hi",
  };

  describe("formsetPropsFor()", () => {
    const ctx = new FormContext(baseOptions, () => {});

    it("throws an error when not passed a formset", () => {
      expect(() => ctx.formsetPropsFor("foo")).toThrowError(
        "invalid formset 'foo'"
      );
    });

    it("works", () => {
      const props = ctx.formsetPropsFor("baz");
      expect(props.items).toEqual([{ thing: 1 }]);
      expect(props.errors).toBeUndefined();
      expect(props.idPrefix).toEqual("blarg");
      expect(props.isLoading).toEqual(false);
      expect(props.name).toEqual("baz");
    });
  });
});
