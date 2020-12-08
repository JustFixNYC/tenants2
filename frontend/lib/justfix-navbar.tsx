import React, { useContext } from "react";
import Navbar from "./ui/navbar";
import { Link } from "react-router-dom";
import { AppContext } from "./app-context";
import JustfixRoutes from "./justfix-routes";
import { StaticImage } from "./ui/static-image";
import { li18n } from "./i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { NavbarLanguageDropdown } from "./ui/language-toggle";

const JustfixBrand: React.FC<{}> = () => {
  const { onboardingInfo } = useContext(AppContext).session;
  const to = JustfixRoutes.locale.homeWithSearch(onboardingInfo);

  return (
    <Link className="navbar-item" to={to}>
      <StaticImage
        ratio="is-128x128"
        src="frontend/img/logo.png"
        alt={li18n._(t`Homepage`)}
      />
    </Link>
  );
};

const JustfixMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);

  return (
    <>
      {session.onboardingInfo && (
        <Link
          className="navbar-item"
          to={JustfixRoutes.locale.homeWithSearch(session.onboardingInfo)}
        >
          <Trans>Take action</Trans>
        </Link>
      )}
      {session.phoneNumber ? (
        <Link className="navbar-item" to={JustfixRoutes.locale.logout}>
          <Trans>Sign out</Trans>
        </Link>
      ) : (
        <Link className="navbar-item" to={JustfixRoutes.locale.login}>
          <Trans>Sign in</Trans>
        </Link>
      )}
      <Link className="navbar-item" to={JustfixRoutes.locale.help}>
        <Trans>Help</Trans>
      </Link>
      <NavbarLanguageDropdown />
    </>
  );
};

export const JustfixNavbar: React.FC<{}> = () => {
  return (
    <Navbar
      brandComponent={JustfixBrand}
      menuItemsComponent={JustfixMenuItems}
    />
  );
};
