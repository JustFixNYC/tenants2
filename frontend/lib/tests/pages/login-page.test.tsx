import React from 'react';
import LoginPage, { getQuerystringVar, getPostOrQuerystringVar, performHardOrSoftRedirect } from '../../pages/login-page';
import { mountWithRouter } from '../util';
import { Route } from 'react-router';

test('login page renders', () => {
  const { wrapper } = mountWithRouter(
    <Route component={LoginPage} />
  );
  expect(wrapper.html()).toContain('Sign in');
});

const searchInfo = (search: string) => ({
  location: { search }
});

const postInfo = (POST: Partial<{ [key: string]: string }>, search = '') => ({
  location: { search },
  legacyFormSubmission: { POST },
});

describe('getQuerystringVar()', () => {
  it('returns the only value when it exists', () => {
    expect(getQuerystringVar(searchInfo('?foo=bar'), 'foo')).toBe('bar');
    expect(getQuerystringVar(searchInfo('?foo='), 'foo')).toBe('');
  });

  it('returns the last value when multiple definitions exist', () => {
    expect(getQuerystringVar(searchInfo('?foo=bar&foo=baz'), 'foo')).toBe('baz');
  });

  it('returns undefined when it does not exist', () => {
    expect(getQuerystringVar(searchInfo(''), 'foo')).toBeUndefined();
    expect(getQuerystringVar(searchInfo('?other=thing'), 'foo')).toBeUndefined();
  });
});

describe('getPostOrQuerystringVar()', () => {
  it('returns POST data when available', () => {
    expect(getPostOrQuerystringVar(postInfo({ blah: 'oof' }), 'blah')).toBe('oof');
  });

  it('returns querystring data when POST is not available', () => {
    expect(getPostOrQuerystringVar(searchInfo('?blah=oof'), 'blah')).toBe('oof');
  });

  it('returns undefined when POST exists but does not contain variable', () => {
    expect(getPostOrQuerystringVar(postInfo({ blah: 'oof' }, '?zoof=z'), 'zoof')).toBeUndefined();
  });
});

describe('performHardOrSoftRedirect()', () => {
  it('performs a soft redirect when the route is known to be in our SPA', () => {
    const push = jest.fn();
    const hardRedirect = jest.fn();
    performHardOrSoftRedirect('/login', { push } as any, hardRedirect);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe('/login');
  });

  it('performs a hard redirect when the route is unknown', () => {
    const push = jest.fn();
    const hardRedirect = jest.fn();
    performHardOrSoftRedirect('/loc/letter.pdf', { push } as any, hardRedirect);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
  });
});
