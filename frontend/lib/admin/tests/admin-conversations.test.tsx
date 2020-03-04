import { normalizeConversationQuery, makeConversationURL, mergeConversationMessages, BaseConversationMessage } from "../admin-conversations";

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

describe("mergeConversationMessages()", () => {
  type MyMsg = BaseConversationMessage & {
    body: string,
  };

  const a: MyMsg = {sid: 'a', ordering: 1, body: 'hi'};
  const b: MyMsg = {sid: 'b', ordering: 2, body: 'there'};
  const c: MyMsg = {sid: 'c', ordering: 3, body: 'dude'};

  it("works with empty lists", () => {
    expect(mergeConversationMessages([], [], 'sid')).toEqual([]);
  });

  it("orders lists in descending order", () => {
    expect(mergeConversationMessages([a, b, c], [], 'sid')).toEqual([c, b, a]);
  });

  it("doesn't duplicate messages", () => {
    expect(mergeConversationMessages([c, b], [b, a], 'sid')).toEqual([c, b, a]);
  });

  it("updates entries", () => {
    const newC: MyMsg = {...c, body: 'dawg'};
    expect(mergeConversationMessages([a, b, c], [newC], 'sid')).toEqual([newC, b, a]);
  });
});
