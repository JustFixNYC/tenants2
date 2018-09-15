import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Navbar from '../navbar';
import { FakeDebugAppContext } from './util';
import { MemoryRouter } from 'react-router';
import { AppContext } from '../app-context';


describe('Navbar', () => {
  let navbar: ReactWrapper;
  let burger: ReactWrapper;
  let devDropdown: ReactWrapper;

  beforeEach(() => {
    navbar = mount(
      <MemoryRouter>
        <AppContext.Provider value={FakeDebugAppContext}>
          <Navbar/>
        </AppContext.Provider>
      </MemoryRouter>
    );
    setLocals();
  });

  function updateNavBar() {
    navbar.update();

    // We need to rebind our locals, because the component
    // tree has changed.
    setLocals();
  }

  function click(target: ReactWrapper) {
    target.simulate('click');

    // Because our event handlers asynchronously update the state,
    // we need to force an update.
    updateNavBar();
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

  it('collapses when focus moves outside the navbar', () => {
    click(burger);
    expect(burger.hasClass('is-active')).toBe(true);

    const btn = document.createElement('button');
    document.body.appendChild(btn);
    try {
      btn.focus();
      updateNavBar();
      expect(burger.hasClass('is-active')).toBe(false);
    } finally {
      document.body.removeChild(btn);
    }
  });
});
