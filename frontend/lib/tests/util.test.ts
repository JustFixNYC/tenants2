import { getElement, assertNotNull } from '../util';

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

describe('assertNotNull()', () => {
  it('raises exception when null', () => {
    expect(() => assertNotNull(null)).toThrowError('expected argument to not be null');
  });

  it('returns argument when not null', () => {
    expect(assertNotNull('')).toBe('');
  });
});
