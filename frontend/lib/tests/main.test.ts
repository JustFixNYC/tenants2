import { getMessage } from '../main';

test('getMessage() works', async () => {
  expect(await getMessage()).toEqual("HELLO FROM JAVASCRIPT-LAND");
});
