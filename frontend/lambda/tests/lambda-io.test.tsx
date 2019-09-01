import { isPlainJsObject, handleFromJSONStream } from "../lambda-io";
import { Readable } from "stream";

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

  const handler = (event: any) => { return { event, status: 200 } };

  const handle = async (thing: any) => {
    const response = await handleFromJSONStream(handler, makeStream(thing));
    return JSON.parse(response.toString('utf-8'));
  }

  it('works', async () => {
    const response = await handle({});
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
