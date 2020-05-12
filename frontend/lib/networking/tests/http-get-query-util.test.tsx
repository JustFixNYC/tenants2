import React from "react";

import {
  QuerystringConverter,
  SupportedQsTypes,
  SyncQuerystringToFields,
} from "../http-get-query-util";
import { FormContext } from "../../forms/form-context";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

describe("QuerystringConverter.toStableQuerystring()", () => {
  it("removes irrelevant values", () => {
    const qs = new QuerystringConverter("?boop=zzz&foo=bar", { boop: "" });
    expect(qs.toStableQuerystring()).toBe("?boop=zzz");
  });

  it("uses values from current search if available", () => {
    const qs = new QuerystringConverter("?boop=zzz", { boop: "hi" });
    expect(qs.toStableQuerystring()).toBe("?boop=zzz");
  });

  it("uses values from current search even if they are empty", () => {
    const qs = new QuerystringConverter("?boop=", { boop: "hi" });
    expect(qs.toStableQuerystring()).toBe("?boop=");
  });

  it("sorts values alphabetically", () => {
    const qs = new QuerystringConverter("?foo=1&bar=2", { foo: "", bar: "" });
    expect(qs.toStableQuerystring()).toBe("?bar=2&foo=1");
  });

  it("pulls default values from default input as fallback", () => {
    const qs = new QuerystringConverter("", { boop: "hi" });
    expect(qs.toStableQuerystring()).toBe("?boop=hi");
  });
});

describe("QuerystringConverter.toFormInput()", () => {
  it("converts only args we care about", () => {
    const qs = new QuerystringConverter("?a=foo&b=bar&c=ignoreMe", {
      a: "",
      b: "",
    });
    expect(qs.toFormInput()).toEqual({ a: "foo", b: "bar" });
  });
});

describe("QuerystringConverter.maybePushToHistory()", () => {
  function makeFakeRouter(pathname = "/") {
    const push = jest.fn();
    const router = {
      location: { pathname },
      history: { push },
    } as any;
    return { router, push };
  }

  function maybePushToHistory<T>(search: string, defaultInput: T, input: T) {
    const { router, push } = makeFakeRouter();
    const qs = new QuerystringConverter(search, defaultInput);
    qs.maybePushToHistory(input, router);
    return { router, push };
  }

  it("pushes to history when querystring is different from input", () => {
    const { push } = maybePushToHistory(
      "",
      { a: "", b: "" },
      { a: "foo", b: "bar" }
    );
    expect(push.mock.calls).toEqual([["/?a=foo&b=bar"]]);
  });

  it("does not push to history when querystring is semantically identical to input", () => {
    const { push } = maybePushToHistory(
      "?b=bar&a=foo",
      { a: "", b: "" },
      { a: "foo", b: "bar" }
    );
    expect(push.mock.calls).toEqual([]);
  });
});

function makeQsAndCtx<T>(
  search: string,
  defaultInput: SupportedQsTypes<T>,
  currentState: T
) {
  const qs = new QuerystringConverter(search, defaultInput);
  const setField = jest.fn();
  const submit = jest.fn();
  const ctx = new FormContext(
    {
      idPrefix: "",
      isLoading: false,
      errors: undefined,
      currentState,
      setField,
      namePrefix: "",
    },
    submit
  );
  return { qs, ctx, setField, submit };
}

describe("QuerystringConverter.areFormFieldsSynced()", () => {
  it("returns false when fields are not synced", () => {
    const { qs, ctx } = makeQsAndCtx("", { blah: "" }, { blah: "hello" });
    expect(qs.areFormFieldsSynced(ctx)).toBe(false);
  });

  it("returns true when fields are synced", () => {
    const { qs, ctx } = makeQsAndCtx(
      "?blah=hello",
      { blah: "" },
      { blah: "hello" }
    );
    expect(qs.areFormFieldsSynced(ctx)).toBe(true);
  });

  it("returns true when fields are blank and search is blank", () => {
    const { qs, ctx } = makeQsAndCtx("", { blah: "" }, { blah: "" });
    expect(qs.areFormFieldsSynced(ctx)).toBe(true);
  });
});

describe("QuerystringConverter.applyToFormFields()", () => {
  it("sets fields that are not synced", () => {
    const { qs, ctx, setField } = makeQsAndCtx(
      "",
      { a: "", b: "" },
      { a: "hello", b: "" }
    );
    expect(qs.applyToFormFields(ctx)).toBe(true);
    expect(setField.mock.calls).toEqual([["a", ""]]);
  });

  it("returns false when fields are already synced", () => {
    const { qs, ctx, setField } = makeQsAndCtx(
      "",
      { a: "", b: "" },
      { a: "", b: "" }
    );
    expect(qs.applyToFormFields(ctx)).toBe(false);
    expect(setField.mock.calls).toEqual([]);
  });
});

describe("SyncQuerystringToFields", () => {
  function makeHarness<T>(
    search: string,
    emptyInput: SupportedQsTypes<T>,
    initialInput: T
  ) {
    const currentInput = Object.assign({}, initialInput);
    let { qs, ctx, submit, setField } = makeQsAndCtx(
      search,
      emptyInput,
      currentInput
    );
    const makeJsx = () => <SyncQuerystringToFields qs={qs} ctx={ctx as any} />;
    const pal = new ReactTestingLibraryPal(makeJsx());
    const rerender = () => pal.rr.rerender(makeJsx());
    return {
      submit,
      setField,
      changeSearch(search: string) {
        qs = new QuerystringConverter(search, emptyInput);
        rerender();
      },
      updateInput(input: Partial<T>) {
        Object.assign(currentInput, input);
        rerender();
      },
    };
  }

  it("submits form once all fields are synced", () => {
    const h = makeHarness("?a=blah&b=goop", { a: "", b: "" }, { a: "", b: "" });
    expect(h.setField.mock.calls).toEqual([
      ["a", "blah"],
      ["b", "goop"],
    ]);
    expect(h.submit).not.toHaveBeenCalled();

    h.updateInput({ a: "blah" });
    expect(h.submit).not.toHaveBeenCalled();

    h.updateInput({ b: "goop" });
    expect(h.submit).toHaveBeenCalled();
  });

  it("only syncs changed fields", () => {
    const h = makeHarness("", { a: "", b: "" }, { a: "", b: "" });
    h.changeSearch("?a=blah");
    expect(h.setField.mock.calls).toEqual([["a", "blah"]]);
  });

  it("does nothing when fields are non-empty and synced", () => {
    const h = makeHarness("?a=b", { a: "" }, { a: "b" });
    expect(h.setField).not.toHaveBeenCalled();
    expect(h.submit).not.toHaveBeenCalled();
  });

  it("does nothing when fields are empty and synced", () => {
    const h = makeHarness("", { a: "" }, { a: "" });
    expect(h.setField).not.toHaveBeenCalled();
    expect(h.submit).not.toHaveBeenCalled();
  });
});
