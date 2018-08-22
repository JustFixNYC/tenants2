import React from 'react';
import { Link } from 'react-router-dom';

import { AppServerInfo } from './app-server-info';
import autobind from 'autobind-decorator';
import { AriaExpandableButton } from './aria';
import { bulmaClasses } from './bulma';

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
          <div className={bulmaClasses('navbar-menu', state.isHamburgerOpen && 'is-active')}>
            <div className="navbar-end">
              {developerMenu}
            </div>
          </div>
        </div>
      </nav>
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

function NavbarDropdown(props: NavbarDropdownProps): JSX.Element {
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
