import { getMessage } from '../app';

jest.useFakeTimers();

test('getMessage() works', async () => {
  const promise = getMessage();

  jest.runAllTimers();

  expect(await promise).toEqual("HELLO FROM JAVASCRIPT-LAND");
});
