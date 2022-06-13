import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Route, Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { TextualFormField, RadiosFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { ProgressButtons, NextButton } from "../../ui/buttons";
import { LaLetterBuilderSendOptionsMutation } from "../../queries/LaLetterBuilderSendOptionsMutation";
import { LaLetterBuilderSendLetterMutation } from "../../queries/LaLetterBuilderSendLetterMutation";
import {
  LaMailingChoice,
  LaMailingChoices,
  getLaMailingChoiceLabels,
} from "../../../../common-data/laletterbuilder-mailing-choices";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { toDjangoChoices } from "../../common-data";
import Page from "../../ui/page";
import { optionalizeLabel } from "../../forms/optionalize-label";

export const LaLetterBuilderSendOptions = MiddleProgressStep((props) => {
  return (
    <Page
      title={li18n._(t`Would you like us to send the letter for you for free?`)}
      withHeading="big"
      className="content"
    >
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderSendOptionsMutation}
        initialState={(s) => ({
          // Default in letter is WE_WILL_MAIL, letter should always exist at this point
          mailChoice:
            s.habitabilityLatestLetter?.mailChoice ||
            ("WE_WILL_MAIL" as LaMailingChoice),
          email: s.landlordDetails?.email || "",
        })}
        onSuccessRedirect={
          LaLetterBuilderRouteInfo.locale.habitability.sendConfirmModal
        }
      >
        {(ctx) => (
          <>
            <hr />
            <RadiosFormField
              {...ctx.fieldPropsFor("mailChoice")}
              choices={toDjangoChoices(
                LaMailingChoices,
                getLaMailingChoiceLabels()
              )}
              label={li18n._(t`Select a mailing method`)}
            />
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              label={optionalizeLabel(
                li18n._(t`Landlord/management company's email`)
              )}
            />
            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={LaLetterBuilderRouteInfo.locale.habitability.sendConfirmModal}
        render={() => <ConfirmModal {...props} />}
      />
    </Page>
  );
});

export const ConfirmModal: React.FC<{
  nextStep: string;
}> = (props) => {
  const { session } = useContext(AppContext);

  // TODO: generalize to other letter types
  const userWillMail =
    session.habitabilityLatestLetter?.mailChoice === "USER_WILL_MAIL";
  const title = userWillMail
    ? li18n._(t`Are you sure you want to send yourself?`)
    : li18n._(t`Send letter now for free`);

  return (
    <Modal title={title} withHeading onCloseGoTo={BackOrUpOneDirLevel}>
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderSendLetterMutation}
        initialState={{}}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            {userWillMail ? (
              <>
                <p>
                  <Trans>
                    You will need to print your letter and mail it to your
                    landlord or property manager.
                  </Trans>
                </p>
                {session.landlordDetails?.email && (
                  <p>{`${li18n._(t`We will email your letter to:`)} ${
                    session.landlordDetails.email
                  }`}</p>
                )}
              </>
            ) : (
              <>
                <p>
                  <span>
                    <Trans>Mail your letter to:</Trans>
                  </span>
                  <span>{session.landlordDetails?.name}</span>
                  <span>{session.landlordDetails?.address}</span>
                </p>
                {session.landlordDetails?.email && (
                  <p>
                    <span>
                      <Trans>Email your letter to:</Trans>
                    </span>
                    <span>{session.landlordDetails.email}</span>
                  </p>
                )}
                <p>
                  <Trans>
                    A copy will be sent to your email and saved to your account.
                  </Trans>
                </p>
              </>
            )}
            <div className="has-text-centered">
              <NextButton
                isLoading={ctx.isLoading}
                label={li18n._(userWillMail ? "Send myself" : "Send letter")}
              />
              <Link
                to={LaLetterBuilderRouteInfo.locale.habitability.sending}
                className="button is-secondary is-medium jf-is-back-button"
              >
                {li18n._(t`Back`)}
              </Link>
            </div>
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Modal>
  );
};
