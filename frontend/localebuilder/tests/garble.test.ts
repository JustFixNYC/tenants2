import { garbleMessage, Garbler } from "../garble";

const wordsToXs: Garbler = (text) => {
  return text
    .split(" ")
    .map((word) => (word ? "X" : ""))
    .join(" ");
};

describe("garbleMessage()", () => {
  const garble = garbleMessage.bind(null, wordsToXs);

  it("works with simple strings", () => {
    expect(garble("Hello world")).toBe("X X");
  });

  it("Doesn't garble tags", () => {
    expect(garble("<0>Hello world</0> <1/>")).toBe("<0>X X</0> <1/>");
  });

  it("Doesn't garble variables", () => {
    expect(garble("Hello {firstName} how goes")).toBe("X {firstName} X X");
  });

  it("Doesn't garble plurals", () => {
    expect(
      garble(
        "Marshals scheduled {totalEvictions, plural, one {one eviction} " +
          "other {# evictions}} across this portfolio."
      )
    ).toBe(
      "X X {totalEvictions, plural, one {X X} other {X X}} X X X"
    );
  });
});
