import React from "react";

import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  normalizeCurrency,
  parseCurrency,
  CurrencyFormFieldProps,
  CurrencyFormField,
} from "../currency-form-field";
import { KEY_ENTER } from "../../util/key-codes";

describe("normalizeCurrency()", () => {
  it("returns empty string if value can't be parsed", () => {
    expect(normalizeCurrency("lolol")).toBe("");
  });

  it("returns value with commas and two decimal places", () => {
    expect(normalizeCurrency("5000")).toBe("5,000.00");
  });
});

describe("parseCurrency()", () => {
  it("parses values with commas and dollar signs", () => {
    expect(parseCurrency("$5,000.00")).toBe(5000);
  });

  it("returns null if value is unparseable", () => {
    expect(parseCurrency("lolol")).toBeNull();
  });
});

describe("CurrencyFormField", () => {
  const label = "how much does salad cost";

  const initState = () => {
    const onChange = jest.fn();
    const props: CurrencyFormFieldProps = {
      label,
      value: "1234",
      onChange,
      name: "amount",
      id: "amount",
      isDisabled: false,
    };
    const pal = new ReactTestingLibraryPal(<CurrencyFormField {...props} />);
    const input = pal.rr.getByLabelText(label) as HTMLInputElement;
    const changeValue = (value: string) => pal.fillFormFields([[label, value]]);
    return { label, onChange, props, pal, input, changeValue };
  };

  

  it("sets initial input value to be human-friendly", () => {
    const { input } = initState();
    expect(input.value).toBe("1,234.00");
  });

  it("sends decimal value to onChange handler but keeps input value human-friendly", () => {
    const { input, onChange, changeValue } = initState();
    changeValue("5512.01");
    expect(input.value).toEqual("5,512.01");
    expect(onChange.mock.calls).toEqual([["5512.01"]]);
  });

  it("maintains two decimal places at all times", () => {
    const { input, changeValue } = initState();
    changeValue("5512");
    expect(input.value).toEqual("5,512.00");
    changeValue("5512.002");
    expect(input.value).toEqual("5,512.00");
  });

  it("normalizes value when props change", () => {
    const { pal, props, input } = initState();
    pal.rr.rerender(<CurrencyFormField {...props} value="9999" />);
    expect(input.value).toEqual("9,999.00");
  });

  describe("if focused", () => {
    const initFocusedState = () => {
      let s = initState();
      s.pal.rt.fireEvent.focus(s.input);
      return s;
    };

    

    it("does not commit input when changed", () => {
      const { input, changeValue, onChange } = initFocusedState();
      changeValue("5512");
      expect(input.value).toEqual("5512");
      expect(onChange.mock.calls).toEqual([]);
    });

    it("commits input when blurred", () => {
      const { input, pal, changeValue, onChange } = initFocusedState();
      changeValue("5512");
      pal.rt.fireEvent.blur(input);
      expect(input.value).toEqual("5,512.00");
      expect(onChange.mock.calls).toEqual([["5512.00"]]);
    });

    it("commits input when enter is pressed", () => {
      const { input, pal, changeValue, onChange } = initFocusedState();
      changeValue("5512");
      pal.rt.fireEvent.keyDown(input, { keyCode: KEY_ENTER });
      expect(input.value).toEqual("5,512.00");
      expect(onChange.mock.calls).toEqual([["5512.00"]]);
    });
  });
});
