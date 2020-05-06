import { isModalRoute, RouteMap, createRoutesForSite } from "../route-util";
import i18n from "../../i18n";

test("isModalRoute() works", () => {
  expect(isModalRoute("/blah")).toBe(false);
  expect(isModalRoute("/blah", "/oof/flarg-modal")).toBe(true);
});

describe("RouteMap", () => {
  it("supports non-parameterized routes", () => {
    const map = new RouteMap({ blah: "/blah", thing: { a: "/a", b: "/b" } });
    expect(map.size).toEqual(3);
    expect(map.exists("/blah")).toBe(true);
    expect(map.exists("/a")).toBe(true);
    expect(map.exists("/b")).toBe(true);
    expect(map.exists("/c")).toBe(false);
  });

  it("ignores route prefixes", () => {
    const map = new RouteMap({ prefix: "/blah" });
    expect(map.size).toEqual(0);
    expect(map.exists("/blah")).toBe(false);
  });

  it("does not double-count the same route", () => {
    const map = new RouteMap({ thing: { prefix: "/thing", home: "/thing" } });
    expect(map.size).toEqual(1);
  });

  it("ignores functions", () => {
    const map = new RouteMap({ blah: "/blah", thing: () => {} });
    expect(map.size).toEqual(1);
  });

  it("supports parameterized routes", () => {
    const map = new RouteMap({ blah: "/blah/:id([0-9]+)" });
    expect(map.size).toEqual(1);
    expect(map.exists("/blah/7")).toBe(true);
    expect(map.exists("/blah/9/zorp")).toBe(false);
  });
});

describe("createRoutesForSite", () => {
  const Routes = createRoutesForSite(
    (prefix) => ({
      foo: `${prefix}/foo`,
    }),
    {
      blarg: "/blarg",
    }
  );

  it("responds to locale changes", () => {
    i18n.initialize("en");
    expect(Routes.locale.foo).toBe("/en/foo");
    expect(Routes.routeMap.exists("/foo")).toBe(false);
    expect(Routes.routeMap.exists("/en/foo")).toBe(true);
    expect(new Set(Routes.routeMap.nonParameterizedRoutes())).toEqual(
      new Set(["/en/foo", "/blarg"])
    );

    i18n.initialize("es");
    expect(Routes.locale.foo).toBe("/es/foo");
    expect(Routes.routeMap.exists("/foo")).toBe(false);
    expect(Routes.routeMap.exists("/es/foo")).toBe(true);
    expect(new Set(Routes.routeMap.nonParameterizedRoutes())).toEqual(
      new Set(["/es/foo", "/blarg"])
    );
  });

  it("has expected non-localized routes", () => {
    expect(Routes.blarg).toBe("/blarg");
  });
});
