import React from "react";
import {
  BaseFormFieldProps,
  TextualFormFieldProps,
  TextualFormField,
  ChoiceFormFieldProps,
  SelectFormField,
  BooleanFormFieldProps,
  CheckboxFormField,
  RadiosFormField,
  MultiChoiceFormFieldProps,
  MultiCheckboxFormField,
  toggleChoice,
  TextareaFormField,
  HiddenFormField,
  renderLabel,
} from "../form-fields";
import { DjangoChoices } from "../../common-data";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { simpleFormErrors } from "../../tests/util";
import { fakeBaseFieldProps } from "./fake-base-field-props";

const CHOICES: DjangoChoices = [
  ["BAR", "Bar"],
  ["BAZ", "Baz"],
];

function choiceFieldProps(
  props: Partial<ChoiceFormFieldProps> = {}
): ChoiceFormFieldProps {
  return {
    ...fakeBaseFieldProps({ value: "" }),
    choices: CHOICES,
    label: "Foo",
    ...props,
  };
}

describe("TextualFormField", () => {
  const makeField = (props: Partial<TextualFormFieldProps> = {}) => {
    const defaultProps: TextualFormFieldProps = {
      ...fakeBaseFieldProps({ value: "" }),
      label: "Foo",
    };
    return new ReactTestingLibraryPal(
      <TextualFormField {...defaultProps} {...props} />
    );
  };

  it("renders properly when it has no errors", () => {
    const html = makeField().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain("is-danger");
  });

  it("renders properly when it has errors", () => {
    const html = makeField({ errors: simpleFormErrors("this cannot be blank") })
      .rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain("is-danger");
  });
});

describe('TextualFormField with type="date"', () => {
  it('clears value when "clear" is clicked', () => {
    const onChange = jest.fn();
    const pal = new ReactTestingLibraryPal(
      (
        <TextualFormField
          type="date"
          label="Boop"
          {...fakeBaseFieldProps({ value: "01/01/2011", onChange })}
        />
      )
    );
    pal.clickButtonOrLink(/Clear/);
    expect(onChange.mock.calls).toEqual([[""]]);
  });
});

describe("HiddenFormField", () => {
  const makeField = (
    props: Partial<BaseFormFieldProps<string | boolean | null | undefined>> = {}
  ) => {
    const defaultProps: BaseFormFieldProps<string> = {
      ...fakeBaseFieldProps({ value: "" }),
    };
    return new ReactTestingLibraryPal(
      <HiddenFormField {...defaultProps} {...props} />
    );
  };

  it("renders name and value attrs", () => {
    for (let value of ["", "blah"]) {
      const html = makeField({ name: "boop", value }).rr.container.innerHTML;
      expect(html).toContain('name="boop"');
      expect(html).toContain(`value="${value}"`);
    }
  });

  it('renders value attr as "on" if it is true', () => {
    const html = makeField({ name: "boop", value: true }).rr.container
      .innerHTML;
    expect(html).toContain('name="boop"');
    expect(html).toContain('value="on"');
  });

  [undefined, false, null].forEach((value) => {
    it(`renders empty value attr if it is ${value}`, () => {
      const html = makeField({ name: "boop", value }).rr.container.innerHTML;
      expect(html).toContain('name="boop"');
      expect(html).toContain('value=""');
    });
  });

  it("throws an exception when it has errors", () => {
    const originalError = console.error;
    console.error = () => {};
    expect(() =>
      makeField({ errors: simpleFormErrors("this cannot be blank") })
    ).toThrow(/Hidden fields should have no errors, but "foo" does/);
    console.error = originalError;
  });
});

describe("TextareaFormField", () => {
  const makeField = (props: Partial<TextualFormFieldProps> = {}) => {
    const defaultProps: TextualFormFieldProps = {
      ...fakeBaseFieldProps({ value: "" }),
      label: "Foo",
    };
    return new ReactTestingLibraryPal(
      <TextareaFormField {...defaultProps} {...props} />
    );
  };

  it("renders name attr and sets value", () => {
    const html = makeField({ name: "blarg", value: "boof" }).rr.container
      .innerHTML;
    expect(html).toContain('name="blarg"');
    expect(html).toContain(">boof</textarea>");
  });

  it("renders properly when it has no errors", () => {
    const html = makeField().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain("is-danger");
  });

  it("renders properly when it has errors", () => {
    const html = makeField({ errors: simpleFormErrors("this cannot be blank") })
      .rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain("is-danger");
  });
});

describe("SelectFormField", () => {
  const makeSelect = (props: Partial<ChoiceFormFieldProps> = {}) => {
    return new ReactTestingLibraryPal(
      <SelectFormField {...choiceFieldProps(props)} />
    );
  };

  it("renders option values", () => {
    const html = makeSelect().rr.container.innerHTML;
    expect(html).toContain('<option value="BAR">Bar</option>');
  });

  it("assigns name attr", () => {
    const html = makeSelect().rr.container.innerHTML;
    expect(html).toContain('name="foo"');
  });

  it("renders properly when it has no errors", () => {
    const html = makeSelect().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain("is-danger");
  });

  it("renders properly when it has errors", () => {
    const html = makeSelect({
      errors: simpleFormErrors("this cannot be blank"),
    }).rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain("is-danger");
  });
});

describe("RadiosFormField", () => {
  const makeRadios = (props: Partial<ChoiceFormFieldProps> = {}) => {
    return new ReactTestingLibraryPal(
      <RadiosFormField {...choiceFieldProps(props)} />
    );
  };

  it("renders name and value attrs", () => {
    const html = makeRadios().rr.container.innerHTML;
    expect(html).toContain('name="foo"');
    expect(html).toContain('value="BAR"');
  });

  it("renders properly when it has no errors", () => {
    const html = makeRadios().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain("is-danger");
  });

  it("renders properly when it has errors", () => {
    const html = makeRadios({
      errors: simpleFormErrors("this cannot be blank"),
    }).rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Foo, this cannot be blank"');
    expect(html).toContain("is-danger");
  });
});

test("toggleChoice works", () => {
  expect(toggleChoice("BOOP", true, ["HI"])).toEqual(["HI", "BOOP"]);
  expect(toggleChoice("BOOP", false, ["HI", "BOOP"])).toEqual(["HI"]);
});

describe("MultiCheckboxFormField", () => {
  const makeMultiCheckbox = (
    props: Partial<MultiChoiceFormFieldProps> = {}
  ) => {
    const defaultProps: MultiChoiceFormFieldProps = {
      ...fakeBaseFieldProps<string[]>({ value: [] }),
      choices: CHOICES,
      label: "Foo",
    };
    return new ReactTestingLibraryPal(
      <MultiCheckboxFormField {...defaultProps} {...props} />
    );
  };

  it("toggles choice on click", () => {
    const onChange = jest.fn();
    const pal = makeMultiCheckbox({ onChange });
    pal.clickRadioOrCheckbox("Bar");
    expect(onChange.mock.calls).toHaveLength(1);
    expect(onChange.mock.calls[0][0]).toEqual(["BAR"]);
  });

  it("renders name and value attrs", () => {
    const html = makeMultiCheckbox().rr.container.innerHTML;
    expect(html).toContain('name="foo"');
    expect(html).toContain('value="BAR"');
  });

  it("renders properly when it has no errors", () => {
    const html = makeMultiCheckbox().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
  });

  it("renders properly when it has errors", () => {
    const html = makeMultiCheckbox({
      errors: simpleFormErrors("this must be checked"),
    }).rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
  });
});

describe("CheckboxFormField", () => {
  const makeCheckbox = (props: Partial<BooleanFormFieldProps> = {}) => {
    const defaultProps: BooleanFormFieldProps = {
      ...fakeBaseFieldProps<boolean>({ value: false }),
      children: "Foo",
    };
    return new ReactTestingLibraryPal(
      <CheckboxFormField {...defaultProps} {...props} />
    );
  };

  it("renders name attr", () => {
    const html = makeCheckbox().rr.container.innerHTML;
    expect(html).toContain('name="foo"');
  });

  it("renders properly when it has no errors", () => {
    const html = makeCheckbox().rr.container.innerHTML;
    expect(html).toContain('aria-invalid="false"');
  });

  it("renders properly when it has errors", () => {
    const html = makeCheckbox({
      errors: simpleFormErrors("this must be checked"),
    }).rr.container.innerHTML;
    expect(html).toContain('aria-invalid="true"');
  });
});

describe("renderLabel()", () => {
  it("defaults to rendering a simple label", () => {
    const pal = new ReactTestingLibraryPal(
      renderLabel("Boopy", { htmlFor: "u" })
    );
    const label = pal.getElement("label", ".label");
    expect(label.getAttribute("for")).toBe("u");
    expect(label.textContent).toBe("Boopy");
  });

  it("renders a custom label if provided with a label renderer", () => {
    const pal = new ReactTestingLibraryPal(
      renderLabel("Boopy", { className: "u" }, (label, props) => (
        <label {...props}>{label.toUpperCase()}</label>
      ))
    );
    const label = pal.getElement("label", ".u");
    expect(label.textContent).toBe("BOOPY");
  });
});
