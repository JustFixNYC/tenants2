import { getElement, assertNotNull, dateAsISO, addDays, friendlyDate, callOnceWithinMs, getFunctionProperty, exactSubsetOrDefault, assertNotUndefined, twoTuple, isDeepEqual, properNoun } from '../util';

describe('getElement()', () => {
  it('throws error when element not found', () => {
    expect(() => getElement('div', '#blarg'))
    .toThrow('Couldn\'t find any elements matching "div#blarg"');
  });

  it('returns element when found', () => {
    const div = document.createElement('div');
    div.id = 'blarg';
    document.body.appendChild(div);

    try {
      expect(getElement('div', '#blarg')).toBe(div);
    } finally {
      document.body.removeChild(div);
    }
  });
});

describe('properNoun()', () => {
  it('works', () => {
    expect(properNoun('STATEN ISLAND')).toEqual('Staten Island');
  });
});

describe('assertNotNull()', () => {
  it('raises exception when null', () => {
    expect(() => assertNotNull(null)).toThrowError('expected argument to not be null');
  });

  it('returns argument when not null', () => {
    expect(assertNotNull('')).toBe('');
  });
});

describe('assertNotUndefined()', () => {
  it('raises exception when undefined', () => {
    expect(() => assertNotUndefined(undefined))
      .toThrowError('expected argument to not be undefined');
  });

  it('returns argument when not undefined', () => {
    expect(assertNotUndefined(null)).toBe(null);
  });
});

test('dateAsISIO() works', () => {
  expect(dateAsISO(new Date(2018, 0, 2))).toBe('2018-01-02');
});

test('addDays() works', () => {
  expect(addDays(new Date(2018, 0, 30), 7).toDateString()).toBe('Tue Feb 06 2018');
});

describe('friendlyDate()', () => {
  const dateStr = "2018-01-02T04:00:00.000Z";

  it('translates to time zone on platforms that support it', () => {
    expect(friendlyDate(new Date(dateStr), 'America/New_York'))
      .toBe("Monday, January 1, 2018");
  });

  it('falls back to local timezone if platform sucks', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementationOnce(() => {
      throw new Error('i am ie11 and idk what a time zone is');
    });
    expect(friendlyDate(new Date(dateStr), 'America/New_York'))
      .toMatch(/January/);
  });

  it('falls back to janky string if platform really sucks', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('i am a really old browser and idk what Intl is');
    });
    expect(friendlyDate(new Date(dateStr), 'America/New_York'))
      .toMatch(/Jan 0/);
  });
});

describe('callOnceWithinMs()', () => {
  beforeEach(() => { jest.useFakeTimers(); });

  it('calls the callback if the given time has elapsed', () => {
    const cb = jest.fn();
    callOnceWithinMs(cb, 100);
    jest.advanceTimersByTime(200);
    expect(cb.mock.calls).toHaveLength(1);
  });

  it('does not call the callback if it has already been called', () => {
    const cb = jest.fn();
    const wrapper = callOnceWithinMs(cb, 1000);
    jest.advanceTimersByTime(200);
    wrapper();
    expect(cb.mock.calls).toHaveLength(1);
    jest.advanceTimersByTime(2000);
    expect(cb.mock.calls).toHaveLength(1);
  });

  it('ensures the callback can only be called once by clients', () => {
    const cb = jest.fn();
    const wrapper = callOnceWithinMs(cb, 1000);
    wrapper();
    wrapper();
    expect(cb.mock.calls).toHaveLength(1);
  });
});

test('getFunctionProperty() works', () => {
  const fn = () => {};

  for (let thing of [{}, fn, { fn }, null, undefined]) {
    expect(getFunctionProperty(thing, 'blop')).toBeUndefined();
  }

  expect(getFunctionProperty({ blop: fn }, 'blop')).toBe(fn);
  expect(getFunctionProperty({ fn }, 'fn')).toBe(fn);
});

test('exactSubsetOrDefault() trims superset keys to subset keys', () => {
  expect(
    exactSubsetOrDefault({
      foo: 1,
      bar: 2
    }, { bar: 5 })
  ).toEqual({ bar: 2 });
});

test('exactSubsetOrDefault() returns default if first arg is null', () => {
  expect(
    exactSubsetOrDefault(null, { bar: 5 })
  ).toEqual({ bar: 5 });
});

test('twoTuple() works', () => {
  expect(twoTuple('blah', 2)).toEqual(['blah', 2]);
});

test('isDeepEqual() works', () => {
  expect(isDeepEqual({a: 1}, {a: 1})).toBe(true);
  expect(isDeepEqual({a: 1}, {a: 2})).toBe(false);
});
