import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { MemoryRouter, Route, Switch } from "react-router";
import { createRedirectWithSearch } from "../redirect-util";

describe("createRedirectWithSearch", () => {
  it("redirects and passes along search params", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <MemoryRouter initialEntries={["/boop?flarg=1"]} initialIndex={0}>
          <Switch>
            <Route
              path="/boop"
              exact
              component={createRedirectWithSearch("/hmm")}
            />
            <Route
              path="/hmm"
              exact
              render={(props) => (
                <p id="hmm">
                  hi {props.location.pathname} {props.location.search}
                </p>
              )}
            />
          </Switch>
        </MemoryRouter>
      )
    );
    expect(pal.getElement("p", "#hmm").textContent).toBe("hi /hmm ?flarg=1");
  });
});
