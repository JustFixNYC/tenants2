import React, { useState } from "react";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { StaticImage } from "../../ui/static-image";
import { getNorentImageSrc } from "../homepage";
import { AriaAnnouncement } from "../../ui/aria";
import { awesomeFetch } from "../../networking/fetch";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [isSuccessful, setSuccess] = useState(false);
  const [response, setResponse] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const locale = li18n.language;

    if (!email) {
      setResponse(li18n._(t`Please enter an email address!`));
      return;
    }

    awesomeFetch("/mailchimp/subscribe", {
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
          setSuccess(true);
          setResponse(li18n._(t`All set! Thanks for subscribing!`));
        } else if (result.errorCode === "INVALID_EMAIL") {
          setResponse(li18n._(t`Oops! That email is invalid.`));
        } else {
          window.Rollbar?.error(
            `Mailchimp email signup responded with error code ${result.errorCode}.`
          );
          setResponse(
            li18n._(t`Oops! A network error occurred. Try again later.`)
          );
        }
      })
      .catch((err) => {
        setResponse(
          li18n._(t`Oops! A network error occurred. Try again later.`)
        );
      });
  };

  return (
    <div>
      <form className="email-form is-horizontal-center" onSubmit={handleSubmit}>
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
              onChange={handleChange}
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
                src={getNorentImageSrc("submitarrow")}
                alt={li18n._(t`Submit email`)}
              />
            </button>
          </div>
        </div>
      </form>
      {response && (
        <>
          <br />
          <p className={isSuccessful ? "has-text-white" : "has-text-danger"}>
            <AriaAnnouncement text={response} />
            {response}
          </p>
        </>
      )}
    </div>
  );
};

export default Subscribe;
