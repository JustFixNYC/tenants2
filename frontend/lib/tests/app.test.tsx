import { getMessage } from '../app';

test('getMessage() works', async () => {
  expect(await getMessage()).toEqual("HELLO FROM JAVASCRIPT-LAND");
});
