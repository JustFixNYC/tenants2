import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { MemoryRouter, Switch, Route, Link } from "react-router-dom";
import { createLocaleRedirectorRoute } from "../locale-redirector";

test("createLocaleRedirectorRoute() works", () => {
  const pal = new ReactTestingLibraryPal(
    (
      <MemoryRouter initialEntries={["/blah/"]}>
        <Switch>
          {createLocaleRedirectorRoute("es", "en")}
          <Route
            render={(props) => (
              <>
                <p>At {props.location.pathname}</p>
                <Link to="/es/thingy">To /es/thingy</Link>
              </>
            )}
          />
        </Switch>
      </MemoryRouter>
    )
  );

  pal.rr.getByText("At /blah/");
  pal.clickButtonOrLink("To /es/thingy");
  pal.rr.getByText("At /en/thingy");
});
