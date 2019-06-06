/** @jest-environment node */

import {
  strContains,
  getGraphQlFragments,
  argvHasOption,
  debouncer
} from "../util";

test('debouncer() works', () => {
  const fn = jest.fn();
  jest.useFakeTimers();

  const debouncedFn = debouncer(fn, 1000);
  debouncedFn(null, 'one');
  debouncedFn(null, 'two');
  jest.runTimersToTime(500);
  debouncedFn(null, 'three');
  expect(fn.mock.calls).toHaveLength(0);

  jest.runTimersToTime(1001);
  expect(fn.mock.calls).toHaveLength(1);
  expect(fn.mock.calls[0][1]).toEqual(['one', 'two', 'three']);

  debouncedFn(null, 'four');
  jest.runTimersToTime(1001);
  expect(fn.mock.calls).toHaveLength(2);
  expect(fn.mock.calls[1][1]).toEqual(['four']);
});

test('argvHasOption() works', () => {
  const oldArgv = process.argv;
  try {
    process.argv = ['foo', '-b'];
    expect(argvHasOption('-b', '--bar')).toBe(true);
    expect(argvHasOption('-z', '--baz')).toBe(false);
  } finally {
    process.argv = oldArgv;
  }
});

test('strContains() works', () => {
  expect(strContains('blarg', 'foo', 'bar')).toBe(false);
  expect(strContains('blarg', 'lar', 'bar')).toBe(true);
});

test('getGraphQlFragments() works', () => {
  expect(getGraphQlFragments('query Boop {\n  blah\n}')).toEqual([]);
  expect(getGraphQlFragments('query Boop {\n  ...blah\n}')).toEqual(['blah']);
  expect(getGraphQlFragments(
    'query Boop {\n  foo { ...blah }\n  bar { ...Mehhh123 } }'
  )).toEqual(['blah', 'Mehhh123']);
});

