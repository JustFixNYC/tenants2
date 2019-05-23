import { withStringifiedBools, withStringifiedNumbers } from "../form-input-util";

describe('withStringifiedBools', () => {
  it('raises error when property is not a boolean', () => {
    expect(() => withStringifiedBools({ boop: 'hi' } as any, 'boop'))
      .toThrowError("Expected key 'boop' to be a boolean, but it is string");
  });

  it('works', () => {
    expect(withStringifiedBools({
      blah: true,
      meh: false,
      glorp: false
    }, 'blah', 'glorp')).toEqual({
      blah: 'True',
      meh: false,
      glorp: 'False'
    });
  });
});

describe('withStringifiedNumbers', () => {
  it('works', () => {
    expect(withStringifiedNumbers({ hi: 3, there: false, buddy: null })).toEqual({
      hi: '3', there: false, buddy: null
    });
  });
});
