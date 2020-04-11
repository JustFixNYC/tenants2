import { getPostOrQuerystringVar, getQuerystringVar } from "../querystring";

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
