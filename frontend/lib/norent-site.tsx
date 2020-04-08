import React from 'react';
import { AppSiteProps } from "./app";

const NorentSite = React.forwardRef<HTMLDivElement, AppSiteProps>((props, ref) => {
  return (
    <section className="section">
      <div className="container" ref={ref}
           data-jf-is-noninteractive tabIndex={-1}>
        <p>Hello, this is the no rent site.</p>
      </div>
    </section>
  );
});

export default NorentSite;
