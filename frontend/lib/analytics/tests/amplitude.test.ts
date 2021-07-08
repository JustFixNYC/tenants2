import i18n from "../../i18n";
import { _forTestingAmplitude as amp } from "../amplitude";

beforeEach(() => {
  i18n.initialize("en");
});

describe("unlocalizePathname() works", () => {
  const { unlocalizePathname } = amp;

  it("unlocalizes paths of the current locale", () => {
    expect(unlocalizePathname("/en/blarg")).toBe("/blarg");

    i18n.initialize("es");
    expect(unlocalizePathname("/es/blarg")).toBe("/blarg");
  });

  it("does not unlocalize paths of the not-current locale", () => {
    expect(unlocalizePathname("/es/blarg")).toBe("/es/blarg");
  });
});

test("getPageInfo() works", () => {
  expect(amp.getPageInfo("/en/blarg")).toEqual({
    pathname: "/blarg",
    locale: "en",
    siteType: "JUSTFIX",
  });
});
