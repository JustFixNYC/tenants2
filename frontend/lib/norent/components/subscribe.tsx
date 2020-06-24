import React from "react";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";

type SubscribeProps = {};

type SubscribeState = {
  email: string;
  success: boolean;
  response: string;
};

class Subscribe extends React.Component<SubscribeProps, SubscribeState> {
  constructor(props: SubscribeProps) {
    super(props);
    this.state = {
      email: "",
      success: false,
      response: "",
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: e.target.value });
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = this.state.email || null;
    const locale = li18n.language;

    if (!email) {
      this.setState({
        response: li18n._(t`Please enter an email address!`),
      });
      return;
    }

    fetch("/mailchimp/subscribe", {
      method: "POST",
      body: `email=${encodeURIComponent(
        email
      )}&language=${locale}&source=norent`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.status === 200) {
          this.setState({
            success: true,
            response: li18n._(t`All set! Thanks for subscribing!`),
          });
        } else if (result.errorCode === "INVALID_EMAIL") {
          this.setState({
            response: li18n._(t`Oops! That email is invalid.`),
          });
        } else {
          window &&
            window.Rollbar &&
            window.Rollbar.error(
              `Mailchimp email signup responded with error code ${result.errorCode}.`
            );
          this.setState({
            response: li18n._(
              t`Oops! A network error occurred. Try again later.`
            ),
          });
        }
      })
      .catch((err) => {
        this.setState({
          response: li18n._(
            t`Oops! A network error occurred. Try again later.`
          ),
        });
      });
  };

  render() {
    return (
      <div>
        <form
          className="email-form is-horizontal-center"
          onSubmit={this.handleSubmit}
        >
          <div className="mc-field-group">
            <div className="control is-expanded">
              <label htmlFor="mce-EMAIL" className="jf-sr-only">
                <Trans>Email</Trans>
              </label>
              <input
                type="email"
                name="EMAIL"
                className="input"
                id="mce-EMAIL"
                onChange={this.handleChange}
                placeholder={li18n._(t`ENTER YOUR EMAIL`)}
              />
            </div>
            <div className="control has-text-centered-touch">
              <button
                className="button"
                type="submit"
                aria-label={li18n._(t`Submit email`)}
              >
                <StaticImage
                  ratio="is-16x16"
                  src={getImageSrc("submitarrow")}
                  alt={li18n._(t`Submit email`)}
                />
              </button>
            </div>
          </div>
        </form>
        {this.state.response && (
          <>
            <br />
            <p
              className={
                this.state.success ? "has-text-white" : "has-text-danger"
              }
            >
              {this.state.response}
            </p>
          </>
        )}
      </div>
    );
  }
}

export default Subscribe;
