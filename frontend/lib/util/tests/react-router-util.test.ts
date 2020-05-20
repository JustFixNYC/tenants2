import { resolveLocationDescriptor } from "../react-router-util";

describe("resolveLocationDescriptor()", () => {
  it("returns string if string is passed in", () => {
    expect(resolveLocationDescriptor("bloop", {} as any)).toBe("bloop");
  });

  it("calls function if function is passed in", () => {
    expect(
      resolveLocationDescriptor((loc) => loc.pathname + "hi", {
        pathname: "boop",
      } as any)
    ).toBe("boophi");
  });
});
