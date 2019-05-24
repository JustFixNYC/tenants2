import { FormInputConverter } from "../form-input-converter";

describe('yesNoRadios()', () => {
  it('raises error when property is not a boolean', () => {
    const conv = new FormInputConverter({ boop: 'hi' } as any);
    expect(() => conv.yesNoRadios('boop'))
      .toThrowError("Expected key 'boop' to be a boolean, but it is string");
  });

  it('works', () => {
    const conv = new FormInputConverter({
      blah: true,
      meh: false,
      glorp: false
    });
    expect(conv.yesNoRadios('blah', 'glorp').data).toEqual({
      blah: 'True',
      meh: false,
      glorp: 'False'
    });
  });
});

describe('finish()', () => {
  it('works', () => {
    const conv = new FormInputConverter({ hi: 3, there: false, buddy: null });
    expect(conv.finish()).toEqual({ hi: '3', there: false, buddy: null });
  });
});
