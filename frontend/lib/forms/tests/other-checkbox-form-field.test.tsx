import React, { useState } from "react";

import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { ProgressiveOtherCheckboxFormField } from "../other-checkbox-form-field";

const baselineLabel = "If you have anything else to say, say it now.";

const enhancedLabel = "Specify other plz";

const fieldName = "my_field";

function SimpleField(props: { disableProgressiveEnhancement?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <ProgressiveOtherCheckboxFormField
      disableProgressiveEnhancement={props.disableProgressiveEnhancement}
      baselineLabel={baselineLabel}
      enhancedLabel={enhancedLabel}
      value={value}
      isDisabled={false}
      id="myField"
      name={fieldName}
      onChange={setValue}
    />
  );
}

describe("EnhancedOtherCheckboxFormField", () => {
  

  it("renders baseline field when not enhanced", () => {
    const pal = new ReactTestingLibraryPal(
      <SimpleField disableProgressiveEnhancement />
    );
    expect(pal.getFormField(baselineLabel).type).toBe("text");
  });

  it("renders enhanced field when enhanced", () => {
    const pal = new ReactTestingLibraryPal(<SimpleField />);

    const getTextField = () => pal.getFormField(enhancedLabel);
    const ensureTextFieldIsHidden = () => expect(getTextField).toThrow();
    const getHiddenField = () =>
      pal.getElement("input", `[type="hidden"][name="${fieldName}"]`);

    // We should start out with just a checkbox and a blank value in the (hidden) field.
    const checkbox = pal.getFormField("Other");
    expect(checkbox.checked).toBe(false);
    ensureTextFieldIsHidden();
    expect(getHiddenField().value).toBe("");

    // Check the checkbox and fill out the field.
    pal.rt.fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(getTextField().value).toEqual("");
    pal.fillFormFields([[enhancedLabel, "Boop"]]);
    expect(getTextField().value).toEqual("Boop");

    // Un-check the checkbox, at which point the (hidden) field is the empty string.
    pal.rt.fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    ensureTextFieldIsHidden();
    expect(getHiddenField().value).toBe("");

    // Re-check the checkbox, at which point the field shows its previous value.
    pal.rt.fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(getTextField().value).toEqual("Boop");
  });
});
