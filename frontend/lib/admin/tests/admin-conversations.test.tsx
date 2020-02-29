import { normalizeConversationQuery, makeConversationURL } from "../admin-conversations";

test("normalizeConversationQuery() works", () => {
  [
    [" blah", "blah"],
    ["(555) 123-4567", "5551234567"],
  ].forEach(([raw, normalized]) => {
    expect(normalizeConversationQuery(raw)).toBe(normalized);
  });
});

test("makeConversationURL() works", () => {
  expect(makeConversationURL("+15551234567")).toBe("/admin/conversations/?phone=%2B15551234567");
});
