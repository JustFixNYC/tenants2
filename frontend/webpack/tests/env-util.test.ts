import * as eu from '../env-util';

test("quoteStrings() works", () => {
  expect(eu.quoteStrings(['foo', 'bar'])).toBe("'foo', 'bar'");
});

describe('strToBoolean()', () => {
  it('returns true for truthy values', () => {
    expect(eu.strToBoolean('true')).toBe(true);
    expect(eu.strToBoolean('YES')).toBe(true);
  });

  it('returns false for falsy values', () => {
    expect(eu.strToBoolean('false')).toBe(false);
    expect(eu.strToBoolean('NO')).toBe(false);
  });

  it('returns null unrecognizeable values', () => {
    expect(eu.strToBoolean('blah')).toBeNull();
  });
});

describe('getEnvBoolean', () => {
  it('returns default for undefined values', () => {
    delete process.env['BOOP'];
    expect(eu.getEnvBoolean('BOOP', false)).toBe(false);
    expect(eu.getEnvBoolean('BOOP', true)).toBe(true);
  });

  it('returns default for empty values', () => {
    process.env['BOOP'] = '';
    expect(eu.getEnvBoolean('BOOP', false)).toBe(false);
    expect(eu.getEnvBoolean('BOOP', true)).toBe(true);
  });

  it('throws error for unrecognized values', () => {
    process.env['BOOP'] = 'zzzz';
    expect(() => eu.getEnvBoolean('BOOP', false)).toThrow(/but it is "zzzz"/);
  });
});
