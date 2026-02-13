import React, { useContext } from "react";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

import Page from "../ui/page";
import JustfixRoutes from "../justfix-route-info";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { LoginMutation, BlankLoginInput } from "../queries/LoginMutation";
import { TextualFormField } from "../forms/form-fields";
import { NextButton } from "../ui/buttons";
import { RouteComponentProps } from "react-router";
import { withAppContext, AppContextType, AppContext } from "../app-context";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { getPostOrQuerystringVar } from "../util/querystring";
import { Link } from "react-router-dom";
import { getPostOnboardingURL } from "../onboarding/signup-intent";
import {
  performHardOrSoftRedirect,
  absolutifyURLToOurOrigin,
} from "../browser-redirect";
import { NEXT } from "../util/route-util";

export interface LoginFormProps {
  next: string;
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LoginMutation}
        initialState={BlankLoginInput}
        onSuccessRedirect={(output, input) => {
          return this.props.next;
        }}
        performRedirect={performHardOrSoftRedirect}
      >
        {(ctx) => (
          <React.Fragment>
            <input type="hidden" name={NEXT} value={this.props.next} />
            <PhoneNumberFormField
              label={li18n._(t`Phone number`)}
              {...ctx.fieldPropsFor("phoneNumber")}
            />
            <TextualFormField
              label={li18n._(t`Password`)}
              type="password"
              {...ctx.fieldPropsFor("password")}
            />
            <div className="field">
              <NextButton isLoading={ctx.isLoading} label={li18n._(t`Sign in`)} />
            </div>
          </React.Fragment>
        )}
      </SessionUpdatingFormSubmitter>
    );
  }
}

const LoginPage = withAppContext(
  (props: RouteComponentProps<any> & AppContextType): JSX.Element => {
    const appContext = useContext(AppContext);
    let next = absolutifyURLToOurOrigin(
      getPostOrQuerystringVar(props, NEXT) ||
        getPostOnboardingURL(appContext.session.onboardingInfo),
      props.server.originURL
    );

    // Once we have migrated to the same styling for the tenant platform and
    // LALOC, remove the box entirely.
    let useBox = appContext.server.siteType != "LALETTERBUILDER";
    return (
      <Page title={li18n._(t`Sign in`)}>
        <div className={`${useBox ? "box" : ""}`}>
          <h1 className="title">
            <Trans>Sign in</Trans>
          </h1>
          <LoginForm next={next} />
          <br />
          <div className="content">
            <p>
              <Trans>
                If you have trouble logging in, you can{" "}
                <Link to={JustfixRoutes.locale.passwordReset.start}>
                  reset your password
                </Link>
                .
              </Trans>
            </p>
            <p>
              <Trans>
                Don't have an account yet? You can sign up for one by composing
                a{" "}
                <Link to={JustfixRoutes.locale.loc.splash}>
                  Letter of Complaint
                </Link>
                !
              </Trans>
            </p>
          </div>
        </div>
      </Page>
    );
  }
);

export default LoginPage;
