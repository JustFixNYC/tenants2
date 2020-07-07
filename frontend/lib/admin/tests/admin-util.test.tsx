import { niceAdminTimestamp } from "../admin-util";

test("niceAdminTimestamp() works", () => {
  const ts = "2020-02-28T00:42:07+00:00";
  expect(niceAdminTimestamp(ts)).toBe("2/27/2020, 7:42 PM");
  expect(niceAdminTimestamp(ts, { seconds: true })).toBe(
    "2/27/2020, 7:42:07 PM"
  );
});
