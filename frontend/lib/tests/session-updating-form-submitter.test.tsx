import React from 'react';
import { pause } from './util';
import { AppTesterPal } from './app-tester-pal';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';

describe('SessionUpdatingFormSubmitter', () => {
  const SomeFormMutation = {
    graphQL: 'blah',
    fetch(fetchImpl: any, input: any) { return fetchImpl('blah', input); }
  };

  afterEach(AppTesterPal.cleanup);

  it('updates session and calls onSuccess if provided', async () => {
    const onSuccess = jest.fn();
    const pal = new AppTesterPal(
      <SessionUpdatingFormSubmitter
        mutation={SomeFormMutation}
        initialState={{ blarg: 1 } as any}
        onSuccess={onSuccess}
        children={(ctx) => {
          ctx.fieldPropsFor('blarg');
          return <button type="submit">submit</button>;
        }} />
    );
    pal.clickButtonOrLink('submit');
    pal.expectFormInput({ blarg: 1 });
    pal.respondWithFormOutput({
      errors: [],
      session: { csrfToken: 'boop' }
    });
    await pause(0);
    expect(pal.appContext.updateSession).toHaveBeenCalledWith({ csrfToken: 'boop' });
    expect(onSuccess).toHaveBeenCalled();
  });
});
