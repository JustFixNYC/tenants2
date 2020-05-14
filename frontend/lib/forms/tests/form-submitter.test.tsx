import React from "react";
import {
  MyFormInput,
  MyFormOutput,
  myInitialState,
  renderMyFormFields,
} from "./my-form";
import {
  createTestGraphQlClient,
  simpleFormErrors,
  nextTick,
} from "../../tests/util";
import { FormSubmitterWithoutRouter, FormSubmitter } from "../form-submitter";
import { MemoryRouter, Switch, Route } from "react-router";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { FormContext } from "../form-context";

describe("FormSubmitter", () => {
  const buildForm = () => {
    let formContext: FormContext<MyFormInput> = null as any;
    const { client } = createTestGraphQlClient();
    const onSuccess = jest.fn();

    const pal = new ReactTestingLibraryPal(
      (
        <FormSubmitterWithoutRouter
          history={null as any}
          location={null as any}
          match={null as any}
          onSubmit={(input: MyFormInput) =>
            client.fetch("blah", { input }).then((r) => r.login)
          }
          onSuccess={(output: MyFormOutput) => {
            onSuccess(output);
          }}
          initialState={myInitialState}
        >
          {(ctx) => {
            formContext = ctx;
            return renderMyFormFields(ctx);
          }}
        </FormSubmitterWithoutRouter>
      )
    );
    const getCtx = () => formContext;
    const fillAndSubmit = () => {
      pal.fillFormFields([
        ["Phone number", "1"],
        ["Password", "2"],
      ]);
      pal.rt.fireEvent.submit(pal.getElement("form"));
    };

    return { pal, client, onSuccess, getCtx, fillAndSubmit };
  };

  it("optionally uses performRedirect() for redirection", async () => {
    const promise = Promise.resolve({ errors: [] });
    const performRedirect = jest.fn();
    const pal = new ReactTestingLibraryPal(
      (
        <MemoryRouter>
          <Switch>
            <Route>
              <FormSubmitter
                onSubmit={() => promise}
                onSuccess={() => {}}
                onSuccessRedirect="/blah"
                performRedirect={performRedirect}
                initialState={myInitialState}
                children={renderMyFormFields}
              />
            </Route>
          </Switch>
        </MemoryRouter>
      )
    );
    pal.rt.fireEvent.submit(pal.getElement("form"));
    await promise;
    expect(performRedirect.mock.calls).toHaveLength(1);
    expect(performRedirect.mock.calls[0][0]).toBe("/blah");
  });

  it("optionally calls onSuccess(), then redirects when successful", async () => {
    const promise = Promise.resolve({ errors: [] });
    const glob = { word: "foo" };
    const BlahPage = () => <p>This is {glob.word}.</p>;
    const pal = new ReactTestingLibraryPal(
      (
        <MemoryRouter>
          <Switch>
            <Route path="/blah" exact component={BlahPage} />
            <Route>
              <FormSubmitter
                onSubmit={() => promise}
                onSuccess={() => {
                  glob.word = "blah";
                }}
                onSuccessRedirect="/blah"
                initialState={myInitialState}
                children={renderMyFormFields}
              />
            </Route>
          </Switch>
        </MemoryRouter>
      )
    );
    pal.rt.fireEvent.submit(pal.getElement("form"));
    await promise;
    expect(pal.rr.container.innerHTML).toBe("<p>This is blah.</p>");
  });

  it("sets state when successful", async () => {
    const { client, onSuccess, getCtx, fillAndSubmit } = buildForm();
    expect(getCtx().isLoading).toBe(false);
    fillAndSubmit();
    expect(getCtx().isLoading).toBe(true);
    client.getRequestQueue()[0].resolve({
      login: {
        errors: [],
        session: "blehhh",
      },
    });
    await nextTick();
    expect(getCtx().isLoading).toBe(false);
    expect(getCtx().nonFieldErrors).toBe(undefined);
    expect(getCtx().fieldPropsFor("phoneNumber").errors).toBe(undefined);
    expect(getCtx().fieldPropsFor("password").errors).toBe(undefined);
    expect(onSuccess.mock.calls).toHaveLength(1);
    expect(onSuccess.mock.calls[0][0]).toEqual({
      errors: [],
      session: "blehhh",
    });
  });

  it("sets state when validation errors occur", async () => {
    const { client, onSuccess, fillAndSubmit, getCtx } = buildForm();
    fillAndSubmit();

    expect(getCtx().isLoading).toBe(true);
    client.getRequestQueue()[0].resolve({
      login: {
        errors: [
          {
            field: "__all__",
            extendedMessages: [{ message: "nope.", code: null }],
          },
        ],
      },
    });
    await nextTick();
    expect(getCtx().isLoading).toBe(false);
    expect(getCtx().nonFieldErrors).toEqual(simpleFormErrors("nope."));
    expect(onSuccess.mock.calls).toHaveLength(0);
  });

  it("sets state when network error occurs", async () => {
    const { client, onSuccess, fillAndSubmit, getCtx } = buildForm();
    fillAndSubmit();

    client.getRequestQueue()[0].reject(new Error("kaboom"));
    await nextTick();
    expect(getCtx().isLoading).toBe(false);
    expect(onSuccess.mock.calls).toHaveLength(0);
  });
});
