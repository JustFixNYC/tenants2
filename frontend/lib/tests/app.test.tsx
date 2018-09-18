import React from 'react';
import { shallow } from 'enzyme';

import { AppWithoutRouter, AppPropsWithRouter } from '../app';
import { createTestGraphQlClient, FakeSessionInfo, FakeServerInfo } from './util';

describe('AppWithoutRouter', () => {
  const buildApp = () => {
    const { client } = createTestGraphQlClient();
    const props: AppPropsWithRouter = {
      initialURL: '/',
      initialSession: FakeSessionInfo,
      server: FakeServerInfo,
      history: null as any,
      location: null as any,
      match: null as any
    };

    const wrapper = shallow(<AppWithoutRouter {...props} />);
    const app = wrapper.instance() as AppWithoutRouter;

    app.gqlClient = client;
    return { client, app };
  };

  it('reports fetch errors', () => {
    const { app } = buildApp();

    const windowAlert = jest.fn();
    jest.spyOn(window, 'alert').mockImplementation(windowAlert);
    const consoleError = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(consoleError);
    const err = new Error('blargghh');
    app.handleFetchError(err);
    expect(consoleError.mock.calls).toHaveLength(1);
    expect(consoleError.mock.calls[0][0]).toBe(err);
    expect(windowAlert.mock.calls).toHaveLength(1);
    expect(windowAlert.mock.calls[0][0]).toContain('network error');
  });

  it('handles session updates', () => {
    const { app } = buildApp();
    app.handleSessionChange({ csrfToken: 'blug' });
    expect(app.state.session.csrfToken).toBe('blug');
  });

  it('tracks pathname changes in google analytics', () => {
    const { app } = buildApp();

    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    try {
      app.handlePathnameChange('/old', '/new');
      expect(mockGtag.mock.calls).toHaveLength(1);
      expect(mockGtag.mock.calls[0][2]).toEqual({ page_path: '/new' });
      mockGtag.mockClear();

      // Ensure it doesn't track anything when the pathname doesn't change.
      app.handlePathnameChange('/new', '/new');
      expect(mockGtag.mock.calls).toHaveLength(0);
    } finally {
      delete window.gtag;
    }
  });

  describe('fetch()', () => {
    it('delegates to GraphQL client fetch', async () => {
      const { app, client } = buildApp();
      const promise = app.fetch('bleh', 'vars');
      const request = client.getRequestQueue()[0];

      expect(request.query).toBe('bleh');
      expect(request.variables).toBe('vars');
      request.resolve('response');
      expect(await promise).toBe('response');
    });

    it('calls handleFetchError() on exceptions', async () => {
      const { app, client } = buildApp();
      const handleErr = app.handleFetchError = jest.fn();
      const promise = app.fetch('bleh', 'vars');
      const err = new Error('alas');

      client.getRequestQueue()[0].reject(err);
      try { await promise; } catch (e) {}

      expect(promise).rejects.toBe(err);
      expect(handleErr.mock.calls).toEqual([[err]]);
    });
  });
});
