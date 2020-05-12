import React from "react";

import { AppTesterPal } from "../../tests/app-tester-pal";
import { QueryLoader } from "../query-loader";
import { ExampleQuery } from "../../queries/ExampleQuery";
import { nextTick } from "../../tests/util";

describe("QueryLoader", () => {
  

  const makePal = () =>
    new AppTesterPal(
      (
        <QueryLoader
          query={ExampleQuery}
          input={{ input: "blah" }}
          loading={(props) => {
            if (props.error)
              return (
                <p>
                  error <button onClick={props.retry}>retry</button>
                </p>
              );
            return <p>loading</p>;
          }}
          render={(output) => {
            return <p>render {output.exampleQuery.hello}</p>;
          }}
        />
      )
    );

  it("shows loading text and renders", async () => {
    const pal = makePal();
    pal.rr.getByText("loading");
    pal.withQuery(ExampleQuery).respondWith({
      exampleQuery: { hello: "FOO" },
    });
    await nextTick();
    pal.rr.getByText("render FOO");
  });

  it("shows error text and allows for retrying", async () => {
    const pal = makePal();
    expect(pal.client.getRequestQueue()).toHaveLength(1);
    pal.getLatestRequest().reject(new Error("kaboom"));
    await nextTick();
    pal.rr.getByText("error");
    pal.rr.getByText("retry").click();
    pal.rr.getByText("loading");
    expect(pal.client.getRequestQueue()).toHaveLength(2);
  });
});
