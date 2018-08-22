import React from 'react';
import { ariaBool, AriaExpandableButton, AriaExpandableButtonProps } from '../aria';
import { shallow } from 'enzyme';


test('ariaBool() works', () => {
  expect(ariaBool(true)).toBe('true');
  expect(ariaBool(false)).toBe('false');
});

const KEYS: { [name: string]: number} = {
  enter: 13,
  space: 32,
  esc: 27,
  a: 65
};

function getKeyCode(name: string): number {
  const number = KEYS[name];
  if (typeof(number) !== 'number') {
    throw new Error(`"${name}" is not a valid key name`);
  }
  return number;
}

describe('AriaExpandableButton', () => {
  let props: AriaExpandableButtonProps;
  let onToggle: jest.Mock;
  let preventDefault: jest.Mock;

  beforeEach(() => {
    preventDefault = jest.fn();
    onToggle = jest.fn();
    props = {
      isExpanded: false,
      onToggle
    };
  });

  it('toggles on click', () => {
    const btn = shallow(<AriaExpandableButton {...props} />);
    btn.simulate('click');
    expect(onToggle.mock.calls.length).toBe(1);
  });

  ['enter', 'space'].forEach(name => {
    it(`toggles on key press of ${name}`, () => {
      const btn = shallow(<AriaExpandableButton {...props} />);
      btn.simulate('keydown', { which: getKeyCode(name), preventDefault });
      expect(onToggle.mock.calls.length).toBe(1);
      expect(preventDefault.mock.calls.length).toBe(1);
    });
  });

  ['esc', 'a'].forEach(name => {
    it(`does not toggle on key press of ${name}`, () => {
      const btn = shallow(<AriaExpandableButton {...props} />);
      btn.simulate('keydown', { which: getKeyCode(name), preventDefault });
      expect(onToggle.mock.calls.length).toBe(0);
      expect(preventDefault.mock.calls.length).toBe(0);
    });
  });

  it('sets aria-expanded="false"', () => {
    const btn = shallow(<AriaExpandableButton {...props} isExpanded={false} />);
    expect(btn.html()).toContain('aria-expanded="false"');
  });

  it('sets aria-expanded="true"', () => {
    const btn = shallow(<AriaExpandableButton {...props} isExpanded={true} />);
    expect(btn.html()).toContain('aria-expanded="true"');
  });

  it('renders children', () => {
    const btn = shallow(<AriaExpandableButton {...props}>Blarg</AriaExpandableButton>);
    expect(btn.html()).toContain('Blarg');
  });
});
