import React from "react";
import AdminConversationsRoutes, {
  normalizeConversationQuery,
  makeConversationsURL,
  mergeConversationMessages,
  BaseConversationMessage,
} from "../admin-conversations";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { UpdateTextingHistoryMutation } from "../../queries/UpdateTextingHistoryMutation";
import { wait } from "@testing-library/react";
import {
  AdminConversation_output_messages,
  AdminConversation,
} from "../../queries/AdminConversation";
import { AdminConversations } from "../../queries/AdminConversations";

test("normalizeConversationQuery() works", () => {
  [
    [" blah", "blah"],
    ["(555) 123-4567", "5551234567"],
  ].forEach(([raw, normalized]) => {
    expect(normalizeConversationQuery(raw)).toBe(normalized);
  });
});

test("makeConversationURL() works", () => {
  expect(makeConversationsURL("", "+15551234567")).toBe(
    "/admin/conversations/?phone=%2B15551234567"
  );
  expect(makeConversationsURL("boop", "+15551234567")).toBe(
    "/admin/conversations/?q=boop&phone=%2B15551234567"
  );
  expect(makeConversationsURL("boop")).toBe("/admin/conversations/?q=boop");
  expect(makeConversationsURL()).toBe("/admin/conversations/");
});

describe("mergeConversationMessages()", () => {
  type MyMsg = BaseConversationMessage & {
    body: string;
  };

  const a: MyMsg = { sid: "a", ordering: 1, body: "hi" };
  const b: MyMsg = { sid: "b", ordering: 2, body: "there" };
  const c: MyMsg = { sid: "c", ordering: 3, body: "dude" };

  it("works with empty lists", () => {
    expect(mergeConversationMessages([], [])).toEqual([]);
  });

  it("orders lists in descending order", () => {
    expect(mergeConversationMessages([a, b, c], [])).toEqual([c, b, a]);
  });

  it("doesn't duplicate messages", () => {
    expect(mergeConversationMessages([c, b], [b, a])).toEqual([c, b, a]);
  });

  it("updates entries", () => {
    const newC: MyMsg = { ...c, body: "dawg" };
    expect(mergeConversationMessages([a, b, c], [newC])).toEqual([newC, b, a]);
  });
});

const BASE_MESSAGE: AdminConversation_output_messages = {
  sid: "SMded05904ccb347238880ca9264e8fe1c",
  dateSent: "2019-05-24T17:44:50+00:00",
  isFromUs: true,
  body: "boop",
  ordering: 20.1,
  errorMessage: null,
};

describe("<AdminConversationsPage>", () => {
  afterEach(AppTesterPal.cleanup);

  it("redirects to login if user isn't logged in", () => {
    const pal = new AppTesterPal(<AdminConversationsRoutes />, {
      url: "/admin/conversations/",
    });
    expect(pal.history.location.pathname).toBe("/admin/login/");
  });

  it("works if user is staff", async () => {
    const pal = new AppTesterPal(<AdminConversationsRoutes />, {
      url: "/admin/conversations/",
      session: {
        isStaff: true,
      },
    });
    expect(pal.history.location.pathname).toBe("/admin/conversations/");
    pal.rr.getByText(/Loading conversations/);
    pal.withQuery(UpdateTextingHistoryMutation).respondWith({
      output: {
        authError: false,
        latestMessage: "2019-05-24T17:44:50+00:00",
      },
    });

    const sidebarQuery = pal.withQuery(AdminConversations);

    await wait(() => sidebarQuery.ensure());

    // Load fake sidebar data.
    sidebarQuery
      .expect({
        query: "",
      })
      .respondWith({
        output: {
          messages: [
            {
              sid: "+15551234567",
              userPhoneNumber: "+15551234567",
              userFullName: "Boop Jones",
              userId: 5,
              ...BASE_MESSAGE,
            },
          ],
          hasNextPage: true,
        },
      });

    await wait(() => pal.rr.getByText("Boop Jones"));

    // Now click on the sidebar entry.
    pal.rr.getByText("Boop Jones").click();
    pal.rr.getByText("5/24/2019, 1:44 PM");
    pal.rr.getByText(/Load more/);

    const panelQuery = pal.withQuery(AdminConversation);

    await wait(() => panelQuery.ensure());

    // Load fake conversation panel data.
    panelQuery
      .expect({
        phoneNumber: "+15551234567",
      })
      .respondWith({
        output: {
          messages: [
            BASE_MESSAGE,
            {
              ...BASE_MESSAGE,
              ordering: BASE_MESSAGE.ordering - 1.0,
              sid: "new sid here",
              body: "here is an older message",
            },
          ],
          hasNextPage: false,
        },
        userDetails: null,
      });

    await wait(() => pal.rr.getByText("here is an older message"));
  });
});
