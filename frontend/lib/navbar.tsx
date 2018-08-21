import React, { ReactEventHandler } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';

import { AppServerInfo } from './app-server-info';

type Dropdown = 'developer';

interface NavbarProps {
  server: AppServerInfo;
}

interface NavbarState {
  currentDropdown: Dropdown|null;
}

export default class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props);
    this.state = { currentDropdown: null };
  }

  toggleDropdown(dropdown: Dropdown) {
    this.setState(state => ({
      currentDropdown: state.currentDropdown === dropdown ? null : dropdown
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
          </div>
          <div className="navbar-menu">
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

interface NavbarDropdownProps {
  name: string;
  children: any;
  isActive: boolean;
  onToggle: () => void;
}

function NavbarDropdown(props: NavbarDropdownProps): JSX.Element {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.which === KEY_ENTER || e.which === KEY_SPACE) {
      e.preventDefault();
      props.onToggle();
    }
  };

  return (
    <div className={classnames('navbar-item', 'has-dropdown', props.isActive ? 'is-active' : null)}>
      <a className="navbar-link" tabIndex={0} onClick={props.onToggle} onKeyDown={handleKeyDown}>
        {props.name}
      </a>

      <div className="navbar-dropdown">
        {props.children}
      </div>
    </div>
  );
}
