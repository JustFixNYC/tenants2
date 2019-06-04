import { NotFound } from '../not-found';

test('NotFound sets status on static renders', () => {
  const ctx: any = { staticContext: {} };
  NotFound(ctx);
  expect(ctx.staticContext.statusCode).toBe(404);
});

test('NotFound does not set status on non-static renders', () => {
  const ctx: any = {};
  NotFound(ctx);
  expect(ctx.staticContext).toBeUndefined();
});
