import { getStreetWithApt } from "../letter-content-util";

describe("getStreetWithApt()", () => {
  it("returns only street if apt is blank", () => {
    expect(getStreetWithApt({ street: "1234 Boop Way", aptNumber: "" })).toBe(
      "1234 Boop Way"
    );
  });

  it("returns street w/ apt if apt is present", () => {
    expect(getStreetWithApt({ street: "1234 Boop Way", aptNumber: "2" })).toBe(
      "1234 Boop Way #2"
    );
  });
});
