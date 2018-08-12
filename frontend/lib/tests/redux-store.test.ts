import { createAppStore } from '../redux-store';

test('defaults to being logged-out', async () => {
  const store = createAppStore();

  expect(store.getState().username).toEqual(null);
});
