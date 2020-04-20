import React from "react";
import { NorentRoutes as Routes } from "../routes";
import { Link } from "react-router-dom";
import { NorentLogo } from "./logo";

const MAILCHIMP_URL =
  "https://nyc.us13.list-manage.com/subscribe/post?u=d4f5d1addd4357eb77c3f8a99&amp;id=588f6c6ef4";

const EmailSignupForm = () => (
  <form
    action={MAILCHIMP_URL}
    className="email-form is-horizontal-center"
    method="post"
    target="_blank"
  >
    <div className="mc-field-group">
      <div className="control is-expanded">
        <label htmlFor="mce-EMAIL" className="jf-sr-only">
          Email
        </label>
        <input
          type="email"
          name="EMAIL"
          className="required email input"
          id="mce-EMAIL"
          placeholder="Enter your email"
        />
      </div>
      <div className="control has-text-centered-touch">
        <button className="button" type="submit" aria-label="Submit email">
          ➔
        </button>
      </div>
    </div>
  </form>
);

export const NorentFooter: React.FC<{}> = () => (
  <footer>
    <div className="container has-background-dark">
      <div className="columns">
        <div className="column is-8">
          <h6 className="title is-size-3 has-text-weight-bold has-text-white">
            Join our mailing list
          </h6>
          <EmailSignupForm />
        </div>
        <div className="column is-4 has-text-right is-uppercase content">
          <Link to={Routes.locale.aboutLetter}>The Letter</Link>
          {/* Will replace when we have log in page ready. */}
          <Link to={Routes.locale.home}>Log in</Link>
          <Link to={Routes.locale.faqs}>Faqs</Link>
          <Link to={Routes.locale.about}>About</Link>
          <a href="https://www.justfix.nyc/privacy-policy">Privacy policy</a>
          <a href="https://www.justfix.nyc/terms-of-use">Terms of use</a>
        </div>
      </div>
      <div className="columns">
        <div className="column is-8">
          <div className="content is-size-7">
            <p>
              Disclaimer: The information in JustFix.nyc does not constitute
              legal advice and must not be used as a substitute for the advice
              of a lawyer qualified to give advice on legal issues pertaining to
              housing. We can help direct you to free legal services if
              necessary.
            </p>
            <NorentLogo size="is-64x64" color="white" />{" "}
            <span>brought to you by JustFix.nyc</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
