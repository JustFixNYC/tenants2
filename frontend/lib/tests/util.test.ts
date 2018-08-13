import { getElement } from '../util';

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
