import React from "react";
import { pause } from "../../tests/util";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { SessionUpdatingFormSubmitter } from "../session-updating-form-submitter";
import { FetchMutationInfo } from "../forms-graphql";

describe("SessionUpdatingFormSubmitter", () => {
  const SomeFormMutation: FetchMutationInfo<any, any> = {
    graphQL: "mutation SomeFormMutation {...}",
    name: "SomeFormMutation",
    fetch(fetchImpl: any, input: any) {
      return fetchImpl("mutation SomeFormMutation {...}", input);
    },
  };

  it("updates session and calls onSuccess if provided", async () => {
    const onSuccess = jest.fn();
    const pal = new AppTesterPal(
      (
        <SessionUpdatingFormSubmitter
          mutation={SomeFormMutation}
          initialState={{ blarg: 1 } as any}
          onSuccess={onSuccess}
          children={(ctx) => {
            ctx.fieldPropsFor("blarg");
            return <button type="submit">submit</button>;
          }}
        />
      )
    );
    pal.clickButtonOrLink("submit");
    pal
      .withFormMutation(SomeFormMutation)
      .expect({ blarg: 1 })
      .respondWith({
        errors: [],
        session: { csrfToken: "boop" },
      });
    await pause(0);
    expect(pal.appContext.updateSession).toHaveBeenCalledWith({
      csrfToken: "boop",
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
