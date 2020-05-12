import React from "react";

import { AppTesterPal } from "../../tests/app-tester-pal";
import { SessionPoller } from "../session-poller";
import { nextTick } from "../../tests/util";

describe("session poller", () => {
  

  it("should work", async () => {
    jest.useFakeTimers();

    const fakeQuery: any = {
      fetch(fetch: any) {
        return fetch("here is a graphql query");
      },
    };

    const pal = new AppTesterPal(
      <SessionPoller query={fakeQuery} intervalMS={500} />
    );
    const { updateSession } = pal.appContext;

    expect(pal.client.getRequestQueue()).toHaveLength(0);
    jest.advanceTimersByTime(500);
    expect(pal.client.getRequestQueue()).toHaveLength(1);
    expect(updateSession.mock.calls).toHaveLength(0);

    const req = pal.client.getRequestQueue()[0];

    expect(req.query).toBe("here is a graphql query");
    req.resolve({ session: { blarg: 1 } });

    await nextTick();

    expect(updateSession.mock.calls).toHaveLength(1);
    expect(updateSession.mock.calls[0][0]).toEqual({ blarg: 1 });

    // Once we unmount the component, no further requests should be issued.

    pal.rerender(<br />);
    jest.advanceTimersByTime(5000);
    expect(pal.client.getRequestQueue()).toHaveLength(1);
  });
});
