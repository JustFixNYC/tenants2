import React from 'react';
import AdminConversationsRoutes, { normalizeConversationQuery, makeConversationURL, mergeConversationMessages, BaseConversationMessage } from "../admin-conversations";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { UpdateTextingHistoryMutation_output } from '../../queries/UpdateTextingHistoryMutation';
import { nextTick } from '../../tests/util';
import { suppressSpuriousActErrors } from '../../tests/react-act-workaround';
import { act } from '@testing-library/react';
import { LatestTextMessagesResult } from '../../queries/LatestTextMessagesResult';
import { AdminConversation_output, AdminConversation_output_messages } from '../../queries/AdminConversation';

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

/**
 * Wait for the next tick *and* call React's act() thingy.
 * I have no idea why this makes our tests work, but it does.
 */
const nextTickAndAct = async () => {
  await nextTick();
  act(() => {});
};

const BASE_MESSAGE: AdminConversation_output_messages = {
  sid: 'SMded05904ccb347238880ca9264e8fe1c',
  dateSent: '2019-05-24T17:44:50+00:00',
  isFromUs: true,
  body: 'boop',
  ordering: 20.1,
  errorMessage: null,
};

describe("<AdminConversationsPage>", () => {
  afterEach(AppTesterPal.cleanup);

  it("redirects to login if user isn't logged in", () => {
    const pal = new AppTesterPal(<AdminConversationsRoutes />, {
      url: '/admin/conversations/',
    });
    expect(pal.history.location.pathname).toBe('/admin/login/');
  });

  it("works if user is staff", async () => {
    const pal = new AppTesterPal(<AdminConversationsRoutes />, {
      url: '/admin/conversations/',
      session: {
        isStaff: true
      }
    });
    expect(pal.history.location.pathname).toBe('/admin/conversations/');
    pal.rr.getByText(/Loading conversations/);
    pal.expectGraphQL(/UpdateTextingHistoryMutation/);
    const output: UpdateTextingHistoryMutation_output = {
      latestMessage: '2019-05-24T17:44:50+00:00',
    };
    pal.getFirstRequest().resolve({output});

    // Load fake sidebar data.
    await suppressSpuriousActErrors(async () => {
      await nextTickAndAct();

      const req = pal.client.getRequestQueue()[1];
      expect(req.query).toMatch(/LatestTextMessagesResult/);
      const output: LatestTextMessagesResult = {
        messages: [{
          sid: '+15551234567',
          userPhoneNumber: '+15551234567',
          userFullName: 'Boop Jones',
          userId: 5,
          ...BASE_MESSAGE
        }],
        hasNextPage: true
      };
      req.resolve({output});
    });

    // Now click on the sidebar entry.
    await nextTickAndAct();

    pal.rr.getByText('Boop Jones').click();
    pal.rr.getByText('5/24/2019, 1:44 PM');
    pal.rr.getByText(/Load more/);

    // Load fake conversation panel data.
    await suppressSpuriousActErrors(async () => {
      await nextTickAndAct();

      const req = pal.client.getRequestQueue()[2];
      expect(req.query).toMatch(/AdminConversation/);
      const output: AdminConversation_output = {
        messages: [BASE_MESSAGE, {
          ...BASE_MESSAGE,
          ordering: BASE_MESSAGE.ordering - 1.0,
          sid: 'new sid here',
          body: 'here is an older message',
        }],
        hasNextPage: false
      };
      req.resolve({output});
    });

    await nextTickAndAct();

    pal.rr.getByText('here is an older message');
  });
});
