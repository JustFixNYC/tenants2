import React from 'react';

import Page from "../page";
import { FormSubmitter } from '../forms';
import { createMutationSubmitHandler } from '../forms-graphql';
import { AppContext } from '../app-context';
import { fetchExampleMutation } from '../queries/ExampleMutation';
import { TextualFormField } from '../form-fields';
import { bulmaClasses } from '../bulma';

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleFormPage(): JSX.Element {
  return (
    <AppContext.Consumer>
    {(appCtx) => (
      <Page title="Example form page">
        This is an example form page.
        <FormSubmitter
          onSubmit={createMutationSubmitHandler(appCtx.fetch, fetchExampleMutation)}
          initialState={{ exampleField: '' }}
        >
          {(ctx) => (
            <React.Fragment>
              <TextualFormField label="Example field" {...ctx.fieldPropsFor('exampleField')} />
              <div className="field">
                <div className="control">
                  <button type="submit" className={bulmaClasses('button', 'is-primary', {
                    'is-loading': ctx.isLoading
                  })}>Submit</button>
                </div>
              </div>
            </React.Fragment>
          )}
        </FormSubmitter>
      </Page>
    )}
    </AppContext.Consumer>
  );
}
