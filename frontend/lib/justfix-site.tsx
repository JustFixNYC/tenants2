import React from "react";
import { Route } from "react-router-dom";

import { LoadingOverlayManager } from "./networking/loading-page";
import MoratoriumBanner from "./ui/covid-banners";
import { AppSiteProps } from "./app";
import { Footer } from "./ui/footer";
import { JustfixNavbar } from "./justfix-navbar";
import { JustfixRouteComponent } from "./justfix-routes";

const JustfixSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <>
        <div className="jf-above-footer-content">
          <JustfixNavbar />
          <MoratoriumBanner pathname={props.location.pathname} />
          <section className="section">
            <div
              className="container"
              ref={ref}
              data-jf-is-noninteractive
              tabIndex={-1}
            >
              <LoadingOverlayManager>
                <Route component={JustfixRouteComponent} />
              </LoadingOverlayManager>
            </div>
          </section>
        </div>
        <Footer pathname={props.location.pathname} />
      </>
    );
  }
);

export default JustfixSite;
