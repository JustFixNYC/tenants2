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
import Page from "../../ui/page";
import { optionalizeLabel } from "../../forms/optionalize-label";
import { twoTuple } from "../../util/util";

interface MailChoiceInfo {
  title: string;
  description: string;
  tags?: string[];
}

const mailChoiceLabels = getLaMailingChoiceLabels();
const MailChoices: { [key: string]: MailChoiceInfo } = {
  WE_WILL_MAIL: {
    title: mailChoiceLabels["WE_WILL_MAIL"],
    tags: [li18n._(t`free`), li18n._(t`no printing`)],
    description: li18n._(
      t`We'll send your letter for you via certified mail in 1-2 business days, at no cost to you.`
    ),
  },
  USER_WILL_MAIL: {
    title: mailChoiceLabels["USER_WILL_MAIL"],
    description: li18n._(
      t`You'll need to download the letter to print and mail yourself.`
    ),
  },
};

export const LaLetterBuilderSendOptions = MiddleProgressStep((props) => {
  const mailChoiceTuples = LaMailingChoices.map((choice) => {
    const data = MailChoices[choice];
    return twoTuple(
      choice,
      <div className="jf-laletterbuilder-mailchoice">
        <div className="jf-laletterbuilder-mailchoice-title">{data.title}</div>
        {data.tags && (
          <div className="jf-laletterbuilder-mailchoice-tags">
            {data.tags.map((el, i) => (
              <span key={i}>{el}</span>
            ))}
          </div>
        )}
        <div>{data.description}</div>
      </div>
    );
  });

  return (
    <Page
      title={li18n._(t`How do you want to send your letter?`)}
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
            <h3>Select a mailing method</h3>
            <RadiosFormField
              {...ctx.fieldPropsFor("mailChoice")}
              choices={mailChoiceTuples}
              label={li18n._(t`Select a mailing method`)}
              hideVisibleLabel={true}
            />
            <h3>
              <Trans>Email a copy to your landlord or property manager</Trans>
            </h3>
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              label={optionalizeLabel(
                li18n._(t`Landlord or property manager email`)
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
    ? li18n._(t`Are you sure you want to mail the letter yourself?`)
    : li18n._(t`Mail letter now for free`);

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
                    <Trans>Mail your letter to:</Trans>{" "}
                  </span>
                  <span>{session.landlordDetails?.name}</span>{" "}
                  <span>{session.landlordDetails?.address}</span>
                </p>
                {session.landlordDetails?.email && (
                  <p>
                    <span>
                      <Trans>Email your letter to:</Trans>{" "}
                    </span>
                    <span>{session.landlordDetails.email}</span>
                  </p>
                )}
              </>
            )}
            <div className="has-text-centered">
              <NextButton
                isLoading={ctx.isLoading}
                label={li18n._(userWillMail ? "Continue" : "Send letter")}
              />
              <Link
                to={LaLetterBuilderRouteInfo.locale.habitability.sending}
                className="button is-light"
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
