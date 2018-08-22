import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Navbar from '../navbar';
import { FakeServerInfo } from './util';
import { MemoryRouter } from 'react-router';


describe('Navbar', () => {
  let navbar: ReactWrapper;
  let burger: ReactWrapper;
  let devDropdown: ReactWrapper;

  beforeEach(() => {
    navbar = mount(
      <MemoryRouter>
        <Navbar server={{...FakeServerInfo, debug: true}} />
      </MemoryRouter>
    );
    setLocals();
  });

  function click(target: ReactWrapper) {
    target.simulate('click');

    // Because our event handlers asynchronously update the state,
    // we need to force an update.
    navbar.update();

    // And then we need to rebind our locals, because the component
    // tree has changed.
    setLocals();
  }

  function setLocals() {
    burger = navbar.find('a.navbar-burger');
    devDropdown = navbar.find('.navbar-item.has-dropdown').last();
  }

  it('toggles burger when clicked', () => {
    expect(burger.hasClass('is-active')).toBe(false);
    click(burger);
    expect(burger.hasClass('is-active')).toBe(true);
    click(burger);
    expect(burger.hasClass('is-active')).toBe(false);
  });

  it('toggles dev dropdown when clicked', () => {
    expect(devDropdown.hasClass('is-active')).toBe(false);
    click(devDropdown.find('a.navbar-link'));
    expect(devDropdown.hasClass('is-active')).toBe(true);
    click(devDropdown.find('a.navbar-link'));
    expect(devDropdown.hasClass('is-active')).toBe(false);
  });
});
