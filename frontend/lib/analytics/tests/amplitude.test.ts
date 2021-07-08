import i18n from "../../i18n";
import { unlocalizePathname } from "../amplitude";

describe("unlocalizePathname", () => {
  it("unlocalizes paths of the current locale", () => {
    i18n.initialize("en");
    expect(unlocalizePathname("/en/blarg")).toBe("/blarg");

    i18n.initialize("es");
    expect(unlocalizePathname("/es/blarg")).toBe("/blarg");
  });

  it("does not unlocalize paths of the not-current locale", () => {
    i18n.initialize("en");
    expect(unlocalizePathname("/es/blarg")).toBe("/es/blarg");
  });
});
