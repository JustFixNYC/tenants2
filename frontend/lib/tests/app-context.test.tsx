import { getAbsoluteStaticURL } from "../app-context";

describe("getAbsoluteStaticURL()", () => {
  it("works when static URL is relative", () => {
    expect(
      getAbsoluteStaticURL({
        staticURL: "/static/",
        originURL: "https://blarg",
      })
    ).toBe("https://blarg/static/");
  });

  it("works when static URL is absolute", () => {
    expect(
      getAbsoluteStaticURL({
        staticURL: "https://static-stuff.com/blah/",
        originURL: "https://blarg",
      })
    ).toBe("https://static-stuff.com/blah/");
  });
});
