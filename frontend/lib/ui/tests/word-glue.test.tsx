import React from "react";

import { splitLastWord, glueToLastWord } from "../word-glue";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

test("splitLastWord() works", () => {
  expect(splitLastWord("boop jones")).toEqual(["boop", "jones"]);
  expect(splitLastWord("boop jones ")).toEqual(["boop", "jones"]);
  expect(splitLastWord(" boop jones")).toEqual(["boop", "jones"]);

  expect(splitLastWord("boop")).toBeNull();
  expect(splitLastWord("boop ")).toBeNull();
  expect(splitLastWord(" boop")).toBeNull();
  expect(splitLastWord("")).toBeNull();
});

describe("glueToLastWord", () => {
  

  it("glues last word when given more than one word", () => {
    const pal = new ReactTestingLibraryPal(
      glueToLastWord("hello there", <br />)
    );
    expect(pal.rr.container.innerHTML).toBe(
      'hello <span class="jf-word-glue">there<br></span>'
    );
  });

  it("glues word when given one word", () => {
    const pal = new ReactTestingLibraryPal(glueToLastWord("hello", <br />));
    expect(pal.rr.container.innerHTML).toBe(
      '<span class="jf-word-glue">hello<br></span>'
    );
  });
});
