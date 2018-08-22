import React from 'react';
import { Helmet } from "react-helmet";
import Navbar from './navbar';

interface PageProps {
  title: string;
  children?: any;
}

export default function Page(props: PageProps): JSX.Element {
  return (
    <section className="hero is-fullheight">
      <Helmet>
        <title>{props.title}</title>
      </Helmet>
      <div className="hero-head">
        <Navbar/>
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
