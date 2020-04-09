import { getSiteType } from "../app-context";
import { FakeServerInfo } from "./util";

describe("getSiteType()", () => {
  it("Returns NORENT_SITE when appropriate", () => {
    expect(getSiteType({...FakeServerInfo, siteName: 'NoRent.org'})).toBe('NORENT_SITE');
  });

  it("Returns JUSTFIX_SITE when appropriate", () => {
    expect(getSiteType({...FakeServerInfo, siteName: 'JustFix.nyc'})).toBe('JUSTFIX_SITE');
    expect(getSiteType({...FakeServerInfo, siteName: 'example.com'})).toBe('JUSTFIX_SITE');
  });
});
