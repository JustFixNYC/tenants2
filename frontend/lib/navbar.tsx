import React from 'react';
import { Link } from 'react-router-dom';

import autobind from 'autobind-decorator';
import { AriaExpandableButton } from './aria';
import { bulmaClasses } from './bulma';
import { AppContext, AppContextType } from './app-context';

type Dropdown = 'developer';

export interface NavbarProps {
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

  renderDevMenu({ server }: AppContextType): JSX.Element|null {
    const { state } = this;

    if (!server.debug) return null;

    return (
      <NavbarDropdown
        name="Developer"
        isHamburgerOpen={state.isHamburgerOpen}
        isActive={state.currentDropdown === 'developer'}
        onToggle={() => this.toggleDropdown('developer')}
      >
        <a className="navbar-item" href={`${server.staticURL}frontend/report.html`}>Webpack analysis</a>
        <a className="navbar-item" href="/graphiql">GraphiQL</a>
        <a className="navbar-item" href={server.adminIndexURL}>Admin</a>
        <a className="navbar-item" href="https://github.com/JustFixNYC/tenants2">GitHub</a>
      </NavbarDropdown>
    );
  }

  renderNavbarBrand({ server }: AppContextType): JSX.Element {
    const { state } = this;

    return (
      <div className="navbar-brand">
        <Link className="navbar-item" to="/">
          <img src={`${server.staticURL}frontend/img/logo.png`} alt="Home" />
        </Link>
        <AriaExpandableButton
          className={bulmaClasses('navbar-burger', state.isHamburgerOpen && 'is-active')}
          isExpanded={state.isHamburgerOpen}
          aria-label="menu"
          onToggle={this.toggleHamburger}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </AriaExpandableButton>
      </div>
    );
  }

  render() {
    const { state } = this;

    return (
      <AppContext.Consumer>
        {appContext => (
          <nav className="navbar">
            <div className="container">
              {this.renderNavbarBrand(appContext)}
              <div className={bulmaClasses('navbar-menu', state.isHamburgerOpen && 'is-active')}>
                <div className="navbar-end">
                  {appContext.session.isStaff && <a className="navbar-item" href={appContext.server.adminIndexURL}>Admin</a>}
                  {this.renderDevMenu(appContext)}
                </div>
              </div>
            </div>
          </nav>
        )}
      </AppContext.Consumer>
    );
  }
}

interface NavbarDropdownProps {
  name: string;
  children: any;
  isHamburgerOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
}

export function NavbarDropdown(props: NavbarDropdownProps): JSX.Element {
  // If the hamburger menu is open, our navbar-link is just
  // inert text; but if it's closed and we're on desktop, it's an
  // interactive menu toggle button. Kind of odd.
  let link = props.isHamburgerOpen
    ? <a className="navbar-link">{props.name}</a>
    : <AriaExpandableButton
        className="navbar-link"
        isExpanded={props.isActive}
        onToggle={props.onToggle}
      >{props.name}</AriaExpandableButton>;

  return (
    <div className={bulmaClasses('navbar-item', 'has-dropdown', props.isActive && 'is-active')}>
      {link}
      <div className="navbar-dropdown">
        {props.children}
      </div>
    </div>
  );
}
