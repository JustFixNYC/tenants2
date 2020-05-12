import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { CityAndStateField } from "../city-and-state-form-field";
import { createFormFieldPropsBuilder } from "./form-field-props-builder";

const ENABLE_MAPBOX = {
  server: {
    mapboxAccessToken: "boop",
  },
};

describe("<CityAndStateField>", () => {
  

  const empty = createFormFieldPropsBuilder("");
  const columbus = createFormFieldPropsBuilder("Columbus");
  const ohio = createFormFieldPropsBuilder("OH");

  const getStateField = (pal: AppTesterPal) =>
    pal.getByLabelTextAndSelector(/state/i, "select") as HTMLSelectElement;

  const getCityField = (pal: AppTesterPal) =>
    pal.getByLabelTextAndSelector(/city/i, "input") as HTMLInputElement;

  const makeField = (city = columbus, state = ohio) => (
    <CityAndStateField cityProps={city.build()} stateProps={state.build()} />
  );

  it("renders baseline if Mapbox is disabled", () => {
    const pal = new AppTesterPal(makeField());
    expect(getStateField(pal).value).toBe("OH");
    expect(getCityField(pal).value).toBe("Columbus");
  });

  it("renders Mapbox field if possible", () => {
    const pal = new AppTesterPal(makeField(), ENABLE_MAPBOX);
    expect(() => getStateField(pal)).toThrow();
    expect(getCityField(pal).value).toBe("Columbus, Ohio");
  });

  it("Does not fall back to baseline if city field has errors", () => {
    const pal = new AppTesterPal(
      makeField(empty.withValue("blah").withError("Not a city!"), ohio),
      ENABLE_MAPBOX
    );
    expect(() => getStateField(pal)).toThrow();
    expect(getCityField(pal).value).toBe("blah, Ohio");
  });

  it("Falls back to baseline if state field has errors", () => {
    const pal = new AppTesterPal(
      makeField(columbus, empty.withError("This field is required.")),
      ENABLE_MAPBOX
    );
    expect(getStateField(pal).value).toBe("");
    expect(getCityField(pal).value).toBe("Columbus");
  });

  it("Only shows city if state field is blank", () => {
    const pal = new AppTesterPal(makeField(columbus, empty), ENABLE_MAPBOX);
    expect(() => getStateField(pal)).toThrow();
    expect(getCityField(pal).value).toBe("Columbus");
  });
});
