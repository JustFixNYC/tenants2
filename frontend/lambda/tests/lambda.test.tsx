/** @jest-environment node */

import { Readable } from 'stream';

import { errorCatchingHandler, handleFromJSONStream, LambdaResponse, isPlainJsObject, getBundleFiles } from '../lambda';
import { AppProps } from '../../lib/app';
import { FakeServerInfo, FakeSessionInfo } from '../../lib/tests/util';

const fakeAppProps: AppProps = {
  initialURL: '/',
  locale: '',
  server: FakeServerInfo,
  initialSession: FakeSessionInfo
};

test('lambda works', async () => {
  jest.setTimeout(10000);
  const response = await errorCatchingHandler(fakeAppProps);
  expect(response.status).toBe(200);
  expect(response.location).toBeNull();
});

test('getBundleFiles() filters out source maps', () => {
  expect(getBundleFiles([
    { file: 'boop.js' },
    { file: 'boop.js.map' }
  ])).toEqual(['boop.js']);
});

test('lambda redirects', async () => {
  const response = await errorCatchingHandler({
    ...fakeAppProps,
    initialURL: '/dev/examples/redirect'
  });
  expect(response.status).toBe(302);
  expect(response.location).toBe('/');
});

test('lambda catches errors', async () => {
  const response = await errorCatchingHandler({
    ...fakeAppProps,
    testInternalServerError: true
  });
  expect(response.status).toBe(500);
  expect(response.traceback).toMatch(/Testing internal server error/i);
  expect(response.traceback).toMatch(/lambda\.tsx/);
});

test('isPlainJsObject works', () => {
  expect(isPlainJsObject(null)).toBe(false);
  expect(isPlainJsObject([])).toBe(false);
  expect(isPlainJsObject({})).toBe(true);
});

describe('handleFromJSONStream', () => {
  const makeStream = (thing: any) => {
    const stream = new Readable();
    let text = typeof(thing) === 'string' ? thing : JSON.stringify(thing);
    stream.push(Buffer.from(text, 'utf-8'));
    stream.push(null);
    return stream;
  }

  const handle = async (thing: any) => {
    const response = await handleFromJSONStream(makeStream(thing));
    return JSON.parse(response.toString('utf-8')) as LambdaResponse;
  }

  it('works', async () => {
    const response = await handle(fakeAppProps);
    expect(response.status).toBe(200);
  });

  it('raises error on malformed input', async () => {
    const response = handle('i am not valid json');
    return expect(response).rejects.toBeInstanceOf(SyntaxError);
  });

  it('raises error on bad JSON input', async () => {
    const response = handle(null);
    return expect(response).rejects.toEqual(new Error("Expected input to be a JS object!"));
  });
});
