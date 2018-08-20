import { getFormErrors } from '../forms';

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
});
