import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { TransformSession } from "../transform-session";
import { MemoryRouter } from "react-router-dom";

describe("TransformSession", () => {
  it("calls child and returns its JSX on transformer success", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <TransformSession transformer={(s) => "HALLO"}>
          {(hi) => <p>result of transform is {hi}</p>}
        </TransformSession>
      )
    );
    pal.rr.getByText("result of transform is HALLO");
  });

  it("shows message on transformer failure", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <MemoryRouter>
          <TransformSession transformer={(s) => null}>
            {(hi) => {
              throw new Error("this should never be called");
            }}
          </TransformSession>
        </MemoryRouter>
      )
    );
    pal.rr.getByText(/we don't have enough information/i);
  });
});
