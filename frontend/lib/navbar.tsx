import React, { ReactEventHandler } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';

import { AppServerInfo } from './app-server-info';
import autobind from 'autobind-decorator';

type Dropdown = 'developer';

interface NavbarProps {
  server: AppServerInfo;
}

interface NavbarState {
  currentDropdown: Dropdown|null;
  isHamburgerOpen: boolean;
}

export default class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props);
    this.state = { currentDropdown: null, isHamburgerOpen: false };
  }

  toggleDropdown(dropdown: Dropdown) {
    this.setState(state => ({
      currentDropdown: state.currentDropdown === dropdown ? null : dropdown,
      isHamburgerOpen: false
    }));
  }

  @autobind
  toggleHamburger() {
    this.setState(state => ({
      currentDropdown: null,
      isHamburgerOpen: !state.isHamburgerOpen
    }));
  }

  @autobind
  handleHamburgerKeyDown(e: React.KeyboardEvent) {
    if (trapEnterOrSpace(e)) {
      this.toggleHamburger();
    }
  }

  render() {
    const { state } = this;
    const { server } = this.props;

    let developerMenu = null;

    if (server.debug) {
      developerMenu = (
        <NavbarDropdown
          name="Developer"
          isHamburgerOpen={state.isHamburgerOpen}
          isActive={state.currentDropdown === 'developer'}
          onToggle={() => this.toggleDropdown('developer')}
        >
          <a className="navbar-item" href={`${server.staticURL}frontend/report.html`}>Webpack bundle analysis</a>
          <a className="navbar-item" href="/graphiql">GraphiQL</a>
          <a className="navbar-item" href={server.adminIndexURL}>Admin</a>
          <a className="navbar-item" href="https://github.com/JustFixNYC/tenants2">GitHub</a>
        </NavbarDropdown>
      );
    }

    return (
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <Link className="navbar-item" to="/">
              <img src={`${server.staticURL}frontend/img/logo.png`} alt="Home" />
            </Link>
            <a className={classnames('navbar-burger', isActiveClass(state.isHamburgerOpen))}
               role="button"
               aria-label="menu"
               aria-expanded={ariaBool(state.isHamburgerOpen)}
               tabIndex={0}
               onClick={this.toggleHamburger}
               onKeyDown={this.handleHamburgerKeyDown}>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>
          <div className={classnames('navbar-menu', isActiveClass(state.isHamburgerOpen))}>
            <div className="navbar-end">
              {developerMenu}
            </div>
          </div>
        </div>
      </nav>
    );
  }
}

const KEY_ENTER = 13;
const KEY_SPACE = 32;

function trapEnterOrSpace(e: React.KeyboardEvent): boolean {
  if (e.which === KEY_ENTER || e.which === KEY_SPACE) {
    e.preventDefault();
    return true;
  }
  return false;
}

function ariaBool(value: boolean): 'true'|'false' {
  return value ? 'true' : 'false';
}

function isActiveClass(value: boolean): 'is-active'|null {
  return value ? 'is-active' : null;
}

interface NavbarDropdownProps {
  name: string;
  children: any;
  isHamburgerOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
}

function NavbarDropdown(props: NavbarDropdownProps): JSX.Element {
  // If the hamburger menu is open, our navbar-link is just
  // inert text; but if it's closed and we're on desktop, it's an
  // interactive menu toggle button. Kind of odd.
  let link = props.isHamburgerOpen
    ? <a className="navbar-link">{props.name}</a>
    : (
      <a className="navbar-link"
         role="button"
         aria-label="menu"
         aria-expanded={ariaBool(props.isActive)}
         tabIndex={0}
         onClick={props.onToggle}
         onKeyDown={(e) => { if (trapEnterOrSpace(e)) props.onToggle(); }}
      >{props.name}</a>
    );

  return (
    <div className={classnames('navbar-item', 'has-dropdown', isActiveClass(props.isActive))}>
      {link}
      <div className="navbar-dropdown">
        {props.children}
      </div>
    </div>
  );
}
