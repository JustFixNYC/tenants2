import { normalizeConversationQuery, makeConversationURL, mergeConversationMessages, BaseConversationMessage } from "../admin-conversations";
import { AdminConversation_output } from "../../queries/AdminConversation";
import { AdminConversations_output } from "../../queries/AdminConversations";

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
    expect(mergeConversationMessages([], [])).toEqual([]);

    // These are really just checks to make sure expectations are met re: our GraphQL API
    // conforming to this function's type signature.
    expect(mergeConversationMessages<AdminConversation_output>([], [])).toEqual([]);
    expect(mergeConversationMessages<AdminConversations_output>([], [])).toEqual([]);
  });

  it("orders lists in descending order", () => {
    expect(mergeConversationMessages([a, b, c], [])).toEqual([c, b, a]);
  });

  it("doesn't duplicate messages", () => {
    expect(mergeConversationMessages([c, b], [b, a])).toEqual([c, b, a]);
  });

  it("updates entries", () => {
    const newC: MyMsg = {...c, body: 'dawg'};
    expect(mergeConversationMessages([a, b, c], [newC])).toEqual([newC, b, a]);
  });
});
