import React from "react";
import { BreaksBetweenLines } from "../breaks-between-lines";
import { renderToStaticMarkup } from "react-dom/server";

describe("<BreaksBetweenLines>", () => {
  it("works with single items", () => {
    expect(renderToStaticMarkup(<BreaksBetweenLines lines="one" />)).toBe(
      "one"
    );
  });

  it("works with empty strings", () => {
    expect(renderToStaticMarkup(<BreaksBetweenLines lines="" />)).toBe("");
  });

  it("works with empty lists", () => {
    expect(renderToStaticMarkup(<BreaksBetweenLines lines={[]} />)).toBe("");
  });

  it("splits strings into lines", () => {
    expect(
      renderToStaticMarkup(<BreaksBetweenLines lines={"one\ntwo"} />)
    ).toBe("one<br/>two");
  });

  it("works with string arrays", () => {
    expect(
      renderToStaticMarkup(<BreaksBetweenLines lines={["one", "two"]} />)
    ).toBe("one<br/>two");
  });
});
