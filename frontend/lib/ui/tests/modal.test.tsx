import React from "react";

import { ModalWithoutRouter, Modal, getOneDirLevelUp } from "../modal";
import { Route, Switch, MemoryRouter } from "react-router";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

function mountPalWithRouter(child: JSX.Element) {
  const route = <Route render={() => child} />;
  const pal = new ReactTestingLibraryPal(<MemoryRouter>{route}</MemoryRouter>);
  return pal;
}

describe("ModalWithoutRouter", () => {
  it("pre-renders modal when on server-side", () => {
    const ctx = { staticContext: {}, onCloseGoTo: "/" } as any;
    const modal = new ModalWithoutRouter(ctx);
    modal.render();
    expect(ctx.staticContext.modal).toBeTruthy();
  });

  it("renders nothing when not active", () => {
    const modal = new ModalWithoutRouter({ onCloseGoTo: "/" } as any);
    expect(modal.render()).toBeNull();
  });
});

describe("Modal", () => {
  

  it("removes pre-rendered modal on mount", () => {
    const div = document.createElement("div");
    div.id = "prerendered-modal";
    document.body.appendChild(div);
    expect(div.parentNode).toBe(document.body);
    mountPalWithRouter(
      <Modal title="blah" onCloseGoTo="/">
        <p>hello</p>
      </Modal>
    );
    expect(div.parentNode).toBeNull();
  });

  it("renders body when mounted, renders nothing when closed", () => {
    const pal = mountPalWithRouter(
      <Switch>
        <Route path="/goodbye" render={() => <p>goodbye</p>} />
        <Route
          render={() => (
            <Modal title="blah" onCloseGoTo="/goodbye">
              <p>hello</p>
            </Modal>
          )}
        />
      </Switch>
    );
    expect(pal.rr.container.innerHTML).toBe("");
    expect(document.body.innerHTML).toContain("hello");

    const close = pal.getElement("a", '[aria-label="close"]');
    pal.rt.fireEvent.click(close);
    expect(document.body.innerHTML).not.toContain("hello");
    expect(pal.rr.container.innerHTML).toContain("goodbye");
  });
});

test("getOneDirLevelUp() works", () => {
  expect(getOneDirLevelUp("/foo/bar")).toBe("/foo");
});
