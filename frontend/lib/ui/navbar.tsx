import React, { useContext } from "react";
import { Link } from "react-router-dom";
import classnames from "classnames";

import autobind from "autobind-decorator";
import { AriaExpandableButton } from "./aria";
import { bulmaClasses } from "./bulma";
import { AppContextType, withAppContext, AppContext } from "../app-context";
import { ga } from "../analytics/google-analytics";

const ALL_DROPDOWNS = Symbol("All dropdowns active (Safe mode only)");

type DropdownId = string | typeof ALL_DROPDOWNS;

export type NavbarProps = AppContextType & {
  /**
   * A component to render the branding at the beginning of the navbar.
   * If omitted, the navbar will have no branding.
   */
  brandComponent?: React.ComponentType<{}>;

  /**
   * A component to render any additional menu items at the end of
   * the navbar. If omitted, the navbar won't have any additional
   * menu items.
   */
  menuItemsComponent?: React.ComponentType<{}>;
};

interface NavbarState {
  currentDropdown: DropdownId | null;
  isHamburgerOpen: boolean;
}

type NavbarContext = {
  isHamburgerOpen: boolean;
  isDropdownActive: (id: DropdownId) => boolean;
  toggleDropdown: (id: DropdownId) => void;
};

const NavbarContext = React.createContext<NavbarContext>({
  isHamburgerOpen: true,
  isDropdownActive: () => false,
  toggleDropdown: () => {},
});

class NavbarWithoutAppContext extends React.Component<
  NavbarProps,
  NavbarState
> {
  navbarRef: React.RefObject<HTMLDivElement>;

  constructor(props: NavbarProps) {
    super(props);
    if (props.session.isSafeModeEnabled) {
      this.state = { currentDropdown: ALL_DROPDOWNS, isHamburgerOpen: true };
    } else {
      this.state = { currentDropdown: null, isHamburgerOpen: false };
    }
    this.navbarRef = React.createRef();
  }

  @autobind
  toggleDropdown(dropdown: DropdownId) {
    this.setState((state) => ({
      currentDropdown: state.currentDropdown === dropdown ? null : dropdown,
      isHamburgerOpen: false,
    }));
  }

  @autobind
  toggleHamburger() {
    ga("send", "event", "hamburger", "toggle");
    this.setState((state) => ({
      currentDropdown: null,
      isHamburgerOpen: !state.isHamburgerOpen,
    }));
  }

  @autobind
  handleFocus(e: FocusEvent) {
    if (
      (this.state.currentDropdown || this.state.isHamburgerOpen) &&
      this.navbarRef.current &&
      e.target instanceof Node &&
      !this.navbarRef.current.contains(e.target)
    ) {
      this.setState({
        currentDropdown: null,
        isHamburgerOpen: false,
      });
    }
  }

  componentDidMount() {
    window.addEventListener("focus", this.handleFocus, true);
    window.addEventListener("resize", this.handleResize, false);
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.handleFocus, true);
    window.removeEventListener("resize", this.handleResize, false);
  }

  @autobind
  isDropdownActive(dropdown: DropdownId) {
    return (
      this.state.currentDropdown === dropdown ||
      this.state.currentDropdown === ALL_DROPDOWNS
    );
  }

  @autobind
  handleResize() {
    this.setState({
      currentDropdown: null,
      isHamburgerOpen: false,
    });
  }

  renderNavbarBrand(): JSX.Element {
    const { navbarLabel } = this.props.server;
    const { state } = this;
    const Brand = this.props.brandComponent;

    return (
      <div className="navbar-brand">
        {Brand && <Brand />}
        {navbarLabel && (
          <div className="navbar-item jf-navbar-label">
            <span className="tag is-warning">{navbarLabel}</span>
          </div>
        )}
        <AriaExpandableButton
          className={bulmaClasses(
            "navbar-burger",
            state.isHamburgerOpen && "is-active"
          )}
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
    const { session, server } = this.props;
    const navClass = classnames(
      "navbar",
      !session.isSafeModeEnabled && "is-fixed-top"
    );
    const MenuItems = this.props.menuItemsComponent;
    const ctx: NavbarContext = {
      isHamburgerOpen: state.isHamburgerOpen,
      isDropdownActive: this.isDropdownActive,
      toggleDropdown: this.toggleDropdown,
    };

    return (
      <NavbarContext.Provider value={ctx}>
        <nav className={navClass} ref={this.navbarRef}>
          <div className="container">
            {this.renderNavbarBrand()}
            <div
              className={bulmaClasses(
                "navbar-menu",
                state.isHamburgerOpen && "is-active"
              )}
            >
              <div className="navbar-end">
                {MenuItems && <MenuItems />}
                {session.isStaff && (
                  <a className="navbar-item" href={server.adminIndexURL}>
                    Admin
                  </a>
                )}
                <DevMenu />
              </div>
            </div>
          </div>
        </nav>
      </NavbarContext.Provider>
    );
  }
}

const DevMenu: React.FC<{}> = () => {
  const { server, session, siteRoutes } = useContext(AppContext);

  if (!server.debug) return null;

  return (
    <NavbarDropdown id="developer" label="Developer">
      {!DISABLE_WEBPACK_ANALYZER && (
        <a
          className="navbar-item"
          href={`${server.staticURL}frontend/report.html`}
        >
          Webpack analysis
        </a>
      )}
      <a className="navbar-item" href="/graphiql">
        GraphiQL
      </a>
      <a className="navbar-item" href="/loc/example.pdf">
        Example PDF
      </a>
      <a className="navbar-item" href="https://github.com/JustFixNYC/tenants2">
        GitHub
      </a>
      {!session.isSafeModeEnabled && (
        <a
          className="navbar-item"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.SafeMode.showUI();
          }}
        >
          Show safe mode UI
        </a>
      )}
      <Link className="navbar-item" to={siteRoutes.dev.home}>
        More tools&hellip;
      </Link>
    </NavbarDropdown>
  );
};

const Navbar = withAppContext(NavbarWithoutAppContext);

export default Navbar;

interface NavbarDropdownProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

export function NavbarDropdown(props: NavbarDropdownProps): JSX.Element {
  const ctx = useContext(NavbarContext);

  // If the hamburger menu is open, our navbar-link is just
  // inert text; but if it's closed and we're on desktop, it's an
  // interactive menu toggle button. Kind of odd.
  let link = ctx.isHamburgerOpen ? (
    <a className="navbar-link">{props.label}</a>
  ) : (
    <AriaExpandableButton
      className="navbar-link"
      isExpanded={ctx.isDropdownActive(props.id)}
      onToggle={() => ctx.toggleDropdown(props.id)}
    >
      {props.label}
    </AriaExpandableButton>
  );

  return (
    <div
      className={bulmaClasses(
        "navbar-item",
        "has-dropdown",
        ctx.isDropdownActive(props.id) && "is-active"
      )}
    >
      {link}
      <div className="navbar-dropdown">{props.children}</div>
    </div>
  );
}
