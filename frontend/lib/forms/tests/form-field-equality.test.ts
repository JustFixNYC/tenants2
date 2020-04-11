import { areArraysEqualIgnoringOrder, areFieldsEqual } from "../form-field-equality";

describe("areArraysEqualIgnoringOrder", () => {
  it("returns false if lengths are different", () => {
    expect(areArraysEqualIgnoringOrder([], [1])).toBe(false);
  });

  it("returns false if contents are different", () => {
    expect(areArraysEqualIgnoringOrder([2], [1])).toBe(false);
  });

  it("returns true if contents are same but order is not", () => {
    expect(areArraysEqualIgnoringOrder([2, 1], [1, 2])).toBe(true);
  });
});

describe('areFieldsEqual', () => {
  it("returns true when fields are equal", () => {
    expect(areFieldsEqual({a: 1}, {a: 1})).toBe(true);
    expect(areFieldsEqual({a: 'a'}, {a: 'a'})).toBe(true);
    expect(areFieldsEqual({a: true}, {a: true})).toBe(true);
    expect(areFieldsEqual({a: false}, {a: false})).toBe(true);
    expect(areFieldsEqual({a: [1, 2]}, {a: [2, 1]})).toBe(true);
    expect(areFieldsEqual({a: [{b: 1, c: 2}]}, {a: [{c: 2, b: 1}]})).toBe(true);
  });

  it("returns false when fields are not equal", () => {
    expect(areFieldsEqual({a: 1}, {a: 2})).toBe(false);
    expect(areFieldsEqual({a: 'a'}, {a: 'b'})).toBe(false);
    expect(areFieldsEqual({a: true}, {a: false})).toBe(false);
    expect(areFieldsEqual({a: [1, 2], c: 2}, {a: [2, 1], c: 1})).toBe(false);
    expect(areFieldsEqual({a: [{b: 1}]}, {a: [{b: 2}]})).toBe(false);
    expect(areFieldsEqual({a: [{b: 1}, {c: 1}]}, {a: [{b: 1}]})).toBe(false);
  });
});
