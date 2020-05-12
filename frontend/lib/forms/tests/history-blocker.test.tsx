import React from "react";

import { AppTesterPal } from "../../tests/app-tester-pal";
import {
  HistoryBlockerManager,
  HistoryBlocker,
  HistoryBlockerManagerWithoutRouter,
  getNavigationConfirmation,
} from "../history-blocker";
import { Route } from "react-router";

describe("HistoryBlocker", () => {
  

  it("blocks while mounted, does not block once unmounted", () => {
    const getUserConfirmation = jest.fn();
    const pal = new AppTesterPal(
      (
        <HistoryBlockerManager>
          <Route path="/" exact render={() => <HistoryBlocker />} />
        </HistoryBlockerManager>
      ),
      { router: { getUserConfirmation } }
    );

    expect(getUserConfirmation).toHaveBeenCalledTimes(0);
    pal.history.push("/blarg");
    expect(getUserConfirmation).toHaveBeenCalledTimes(1);
    const [msg, cb] = getUserConfirmation.mock.calls[0];
    expect(msg).toMatch(/are you sure/i);
    expect(pal.history.location.pathname).toBe("/");
    cb(true);
    expect(pal.history.location.pathname).toBe("/blarg");

    getUserConfirmation.mockClear();

    pal.history.push("/");
    expect(getUserConfirmation).toHaveBeenCalledTimes(0);
    expect(pal.history.location.pathname).toBe("/");
  });

  it("does not block in reportOnly mode", () => {
    const getUserConfirmation = jest.fn();
    const pal = new AppTesterPal(
      (
        <HistoryBlockerManager>
          <Route path="/" exact render={() => <HistoryBlocker reportOnly />} />
        </HistoryBlockerManager>
      ),
      { router: { getUserConfirmation } }
    );

    pal.history.push("/blarg");
    expect(getUserConfirmation).toHaveBeenCalledTimes(0);
  });
});

describe("HistoryBlockerManagerWithoutRouter", () => {
  const makeManager = (props: any = {}) =>
    new HistoryBlockerManagerWithoutRouter(props);

  it("throws error if unblock() called with an invalid callback", () => {
    const mgr = makeManager();
    expect(() => mgr.unblock(null as any)).toThrow(
      /was not previously registered/
    );
  });

  it("decides to block if any callbacks return true", () => {
    const mgr = makeManager();
    mgr.block(() => false);
    mgr.block(() => true);
    expect(mgr.shouldBlock()).toBe(true);
  });

  it("decides to not block if all callbacks return false", () => {
    const mgr = makeManager();
    mgr.block(() => false);
    mgr.block(() => false);
    expect(mgr.shouldBlock()).toBe(false);
  });

  it("prevents default on beforeunload if needed", () => {
    const mgr = makeManager();
    mgr.block(() => true);
    const event = { preventDefault: jest.fn(), returnValue: "not set" };
    expect(mgr.handleBeforeUnload(event as any)).toBe("");
    expect(event.returnValue).toBe("");
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does not prevent default on beforeunload if not needed", () => {
    const mgr = makeManager();
    mgr.block(() => false);
    const event = { preventDefault: jest.fn(), returnValue: "not set" };
    expect(mgr.handleBeforeUnload(event as any)).toBeUndefined();
    expect(event.returnValue).toBe("not set");
    expect(event.preventDefault).toHaveBeenCalledTimes(0);
  });
});

test("getNavigationConfirmation() works", () => {
  const confirm = jest.fn();
  const cb = jest.fn();
  window.confirm = confirm;

  confirm.mockReturnValue(true);
  getNavigationConfirmation("boop", cb);

  expect(confirm).toHaveBeenCalledWith("boop");
  expect(cb).toHaveBeenCalledWith(true);

  confirm.mockReturnValue(false);
  cb.mockClear();
  getNavigationConfirmation("blarg", cb);
  expect(cb).toHaveBeenCalledWith(false);
});
