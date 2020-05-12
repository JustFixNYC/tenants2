import React from "react";

import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { Formset, removeEmptyFormsAtEnd, addEmptyForms } from "../formset";
import { TextualFormField } from "../form-fields";

describe("Formset", () => {
  

  it("works", () => {
    type MyItem = { foo: string; bar: string };
    const emptyForm: MyItem = { foo: "", bar: "" };
    const items: MyItem[] = [
      { foo: "hi", bar: "a" },
      { foo: "there", bar: "b" },
    ];
    const onChange = jest.fn();
    const pal = new ReactTestingLibraryPal(
      (
        <Formset
          items={items}
          onChange={onChange}
          idPrefix="blarg"
          isLoading={false}
          name="blop"
          emptyForm={emptyForm}
        >
          {(ctx, i) => (
            <>
              <TextualFormField
                label={`Foo ${i}`}
                {...ctx.fieldPropsFor("foo")}
              />
              <TextualFormField
                label={`Bar ${i}`}
                {...ctx.fieldPropsFor("bar")}
              />
            </>
          )}
        </Formset>
      )
    );
    const foo0 = pal.getFormField("Foo 0");
    expect(foo0.value).toEqual("hi");
    expect(foo0.name).toEqual("blop-0-foo");

    const foo2 = pal.getFormField("Foo 2");
    expect(foo2.value).toEqual("");

    pal.fillFormFields([["Foo 0", "hiii"]]);
    expect(onChange).toHaveBeenCalledWith([
      { foo: "hiii", bar: "a" },
      { foo: "there", bar: "b" },
    ]);
  });
});

describe("removeEmptyFormsAtEnd()", () => {
  it("does nothing if not given an empty object", () => {
    expect(removeEmptyFormsAtEnd([{ foo: "blarg" }, { foo: "" }])).toEqual([
      { foo: "blarg" },
      { foo: "" },
    ]);
  });

  it("does nothing if there are no empty forms", () => {
    expect(removeEmptyFormsAtEnd([{ foo: "blarg" }], { foo: "" })).toEqual([
      { foo: "blarg" },
    ]);
  });

  it("removes empty forms at end if given an empty object", () => {
    expect(
      removeEmptyFormsAtEnd([{ foo: "blarg" }, { foo: "" }], { foo: "" })
    ).toEqual([{ foo: "blarg" }]);
  });

  it("removes all forms if they are all empty", () => {
    expect(
      removeEmptyFormsAtEnd([{ foo: "" }, { foo: "" }], { foo: "" })
    ).toEqual([]);
  });

  it("does not remove empty forms in the middle", () => {
    expect(
      removeEmptyFormsAtEnd(
        [{ foo: "blarg" }, { foo: "" }, { foo: "narg" }, { foo: "" }],
        { foo: "" }
      )
    ).toEqual([{ foo: "blarg" }, { foo: "" }, { foo: "narg" }]);
  });
});

describe("addEmptyForms()", () => {
  const foo = "hi";
  const emptyForm = { foo: "" };

  it("does nothing if not given an empty object", () => {
    expect(addEmptyForms({ items: [] })).toEqual({
      initialForms: 0,
      items: [],
    });
    expect(addEmptyForms({ items: [{ foo }] })).toEqual({
      initialForms: 1,
      items: [{ foo }],
    });
  });

  it("adds one empty form by default", () => {
    expect(addEmptyForms({ items: [{ foo }], emptyForm })).toEqual({
      initialForms: 1,
      items: [{ foo }, emptyForm],
    });
  });

  it("adds multiple empty forms if directed to", () => {
    expect(addEmptyForms({ items: [{ foo }], extra: 2, emptyForm })).toEqual({
      initialForms: 1,
      items: [{ foo }, emptyForm, emptyForm],
    });
  });

  it("adds at most one empty form if mounted", () => {
    expect(
      addEmptyForms({ items: [{ foo }], emptyForm, extra: 2, isMounted: true })
    ).toEqual({ initialForms: 1, items: [{ foo }, emptyForm] });
  });

  it("adds no empty forms if configured to, even when mounted", () => {
    for (let isMounted of [true, false]) {
      expect(
        addEmptyForms({ items: [{ foo }], emptyForm, extra: 0, isMounted })
      ).toEqual({ initialForms: 1, items: [{ foo }] });
    }
  });

  it("does not exceed max forms", () => {
    expect(addEmptyForms({ items: [{ foo }], emptyForm, maxNum: 1 })).toEqual({
      initialForms: 1,
      items: [{ foo }],
    });
  });

  it("ignores existing empty forms at end", () => {
    expect(addEmptyForms({ items: [{ foo }, emptyForm], emptyForm })).toEqual({
      initialForms: 1,
      items: [{ foo }, emptyForm],
    });
  });
});
