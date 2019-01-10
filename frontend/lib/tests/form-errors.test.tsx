import { formatErrors, getFormErrors, parseFormsetField, addToFormsetErrors } from "../form-errors";
import { shallow } from "enzyme";
import { assertNotNull } from "../util";

describe('formatErrors()', () => {
  it('concatenates errors', () => {
    const { errorHelp } = formatErrors({
      errors: ['foo', 'bar']
    });
    expect(shallow(assertNotNull(errorHelp)).html())
      .toBe('<p class="help is-danger">foo bar</p>');
  });

  it('returns null for errorHelp when no errors exist', () => {
    expect(formatErrors({}).errorHelp).toBeNull();
  });

  it('creates an ariaLabel', () => {
    expect(formatErrors({
      errors: ['this field is required'],
      label: 'Name'
    }).ariaLabel).toBe('Name, this field is required');
  });
});

describe('getFormErrors()', () => {
  it('works with an empty array', () => {
    expect(getFormErrors([])).toEqual({
      nonFieldErrors: [],
      fieldErrors: {}
    });
  });

  it('sets nonFieldErrors', () => {
    expect(getFormErrors([{
      field: '__all__',
      messages: ['foo', 'bar']  
    }])).toEqual({
      nonFieldErrors: ['foo', 'bar'],
      fieldErrors: {}
    });
  });

  it('sets fieldErrors', () => {
    expect(getFormErrors([{
      field: 'boop',
      messages: ['foo', 'bar']  
    }])).toEqual({
      nonFieldErrors: [],
      fieldErrors: {
        boop: ['foo', 'bar']
      }
    });
  });

  it('combines multiple field error messages', () => {
    expect(getFormErrors([{
      field: 'boop',
      messages: ['foo']
    }, {
      field: 'boop',
      messages: ['bar']
    }])).toEqual({
      nonFieldErrors: [],
      fieldErrors: {
        boop: ['foo', 'bar']
      }
    });
  });

  it('sets formsetErrors', () => {
    expect(getFormErrors([{
      field: 'blarg.0.boop',
      messages: ['foo', 'bar']
    }])).toEqual({
      nonFieldErrors: [],
      fieldErrors: {},
      formsetErrors: {
        blarg: [{
          nonFieldErrors: [],
          fieldErrors: {
            boop: ['foo', 'bar']
          }
        }]
      }
    });
  });
});

describe("parseFormsetField()", () => {
  it("returns information about a match", () => {
    expect(parseFormsetField("blarg.1.narg")).toEqual({
      formset: 'blarg',
      index: 1,
      field: 'narg'
    });
  });

  it("returns null when nothing matches", () => {
    expect(parseFormsetField("blarg")).toBeNull();
  });
});

describe("addToFormsetErrors()", () => {
  it("returns false when nothing is added", () => {
    const errors = {};
    expect(addToFormsetErrors(errors, { field: 'blah', messages: ['hi'] })).toBe(false);
    expect(errors).toEqual({});
  });

  it("populates errors", () => {
    const errors = {};
    expect(addToFormsetErrors(errors, { field: 'blah.0.bop', messages: ['hi'] })).toBe(true);
    expect(errors).toEqual({
      blah: [{
        nonFieldErrors: [],
        fieldErrors: {
          bop: ['hi']
        }
      }]
    });
  });

  it("can create arrays with holes", () => {
    const errors = {};
    addToFormsetErrors(errors, { field: 'blah.0.bop', messages: ['hi'] });
    expect(addToFormsetErrors(errors, { field: 'blah.2.bop', messages: ['hmm'] })).toBe(true);
    expect(errors).toEqual({
      blah: [{
        nonFieldErrors: [],
        fieldErrors: {
          bop: ['hi']
        }
      }, undefined, {
        nonFieldErrors: [],
        fieldErrors: {
          bop: ['hmm']
        }
      }]
    });
  });

  it("populates non-field errors", () => {
    const errors = {};
    expect(addToFormsetErrors(errors, { field: 'blah.0.__all__', messages: ['hi'] })).toBe(true);
    expect(errors).toEqual({
      blah: [{
        nonFieldErrors: ['hi'],
        fieldErrors: {}
      }]
    });
  });
});
