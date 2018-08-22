import React from 'react';
import { Helmet } from "react-helmet";
import Navbar from './navbar';
import { AppServerInfo } from './app-server-info';

interface PageProps {
  title: string;
  server: AppServerInfo;
  children?: any;
}

export default function Page(props: PageProps): JSX.Element {
  return (
    <section className="hero is-fullheight">
      <Helmet>
        <title>{props.title}</title>
      </Helmet>
      <div className="hero-head">
        <Navbar server={props.server} />
      </div>
      <div className="hero-body">
        <div className="container content box has-background-white">
          {props.children}
        </div>
      </div>
      <div className="hero-foot"></div>
    </section>
  );
}
