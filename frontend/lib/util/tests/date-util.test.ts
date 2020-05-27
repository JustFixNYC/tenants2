import { dateAsISO, addDays, friendlyDate } from "../date-util";
import i18n from "../../i18n";

test("dateAsISIO() works", () => {
  expect(dateAsISO(new Date(2018, 0, 2))).toBe("2018-01-02");
});

test("addDays() works", () => {
  expect(addDays(new Date(2018, 0, 30), 7).toDateString()).toBe(
    "Tue Feb 06 2018"
  );
});

describe("friendlyDate()", () => {
  const dateStr = "2018-01-02T04:00:00.000Z";

  beforeEach(() => i18n.initialize("en"));

  it("translates to time zone on platforms that support it", () => {
    expect(friendlyDate(new Date(dateStr), "America/New_York")).toBe(
      "Monday, January 1, 2018"
    );
  });

  it("falls back to local timezone if platform sucks", () => {
    jest.spyOn(Intl, "DateTimeFormat").mockImplementationOnce(() => {
      throw new Error("i am ie11 and idk what a time zone is");
    });
    expect(friendlyDate(new Date(dateStr), "America/New_York")).toMatch(
      /January/
    );
  });

  it("falls back to janky string if platform really sucks", () => {
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("i am a really old browser and idk what Intl is");
    });
    expect(friendlyDate(new Date(dateStr), "America/New_York")).toMatch(
      /Jan 0/
    );
  });

  it("uses currently active locale", () => {
    i18n.initialize("es");

    expect(friendlyDate(new Date(dateStr), "America/New York")).toBe(
      "lunes, 1 de enero de 2018"
    );
  });
});
