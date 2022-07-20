import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Route, Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import {
  TextualFormField,
  RadiosFormField,
  CheckboxFormField,
} from "../../forms/form-fields";
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
import { twoTuple } from "../../util/util";
import { EmailPreview } from "../components/letter-preview";
import { HabitabilityLetterEmailToLandlordForUser } from "./habitability/habitability-letter-content";
import { TagInfo } from "./choose-letter";

interface MailChoiceInfo {
  title: string;
  description: string;
  tags?: TagInfo[];
}

const mailChoiceLabels = getLaMailingChoiceLabels();
const MailChoices: { [key: string]: MailChoiceInfo } = {
  WE_WILL_MAIL: {
    title: mailChoiceLabels["WE_WILL_MAIL"],
    tags: [
      { label: li18n._(t`free`), className: "is-yellow" },
      { label: li18n._(t`no printing`), className: "is-pink" },
    ],
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
  const { session } = useContext(AppContext);

  const mailChoiceTuples = LaMailingChoices.map((choice) => {
    const data = MailChoices[choice];
    return twoTuple(
      choice,
      <div className="jf-laletterbuilder-mailchoice">
        <div className="jf-laletterbuilder-mailchoice-title">{data.title}</div>
        {data.tags && (
          <div className="jf-laletterbuilder-mailchoice-tags">
            {data.tags.map((el, i) => (
              <span key={i} className={`tag ${el.className}`}>
                {el.label}
              </span>
            ))}
          </div>
        )}
        <p className="is-small">{data.description}</p>
      </div>
    );
  });

  return (
    <Page
      title={li18n._(t`How do you want to send your letter?`)}
      withHeading="big"
    >
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderSendOptionsMutation}
        initialState={(s) => ({
          // Default in letter is WE_WILL_MAIL, letter should always exist at this point
          mailChoice:
            s.habitabilityLatestLetter?.mailChoice ||
            ("WE_WILL_MAIL" as LaMailingChoice),
          noLandlordEmail:
            s.habitabilityLatestLetter?.emailToLandlord !== null
              ? !s.habitabilityLatestLetter?.emailToLandlord
              : false,
          email: "",
        })}
        onSuccessRedirect={
          LaLetterBuilderRouteInfo.locale.habitability.sendConfirmModal
        }
      >
        {(ctx) => {
          return (
            <>
              <hr />
              <h3>Select a mailing method</h3>
              <RadiosFormField
                {...ctx.fieldPropsFor("mailChoice")}
                choices={mailChoiceTuples}
                label={li18n._(t`Select a mailing method`)}
                labelClassName=""
                hideVisibleLabel={true}
              />
              <h3>
                <Trans>Email a copy to your landlord or property manager</Trans>
              </h3>
              {session.landlordDetails?.email && (
                <div className="jf-laletterbuilder-landlord-email">
                  <span>
                    {li18n._(t`We found this email address for your landlord:`)}
                  </span>
                  <span>{session.landlordDetails.email}</span>
                </div>
              )}
              <div className="jf-related-text-field-with-checkbox jf-space-below-2rem">
                <TextualFormField
                  type="email"
                  {...ctx.fieldPropsFor("email")}
                  isDisabled={ctx.fieldPropsFor("noLandlordEmail").value}
                  label={li18n._(t`Landlord or property manager email`)}
                />
                <CheckboxFormField
                  {...ctx.fieldPropsFor("noLandlordEmail")}
                  onChange={(checked) => {
                    // When this checkbox is checked, we erase the entered email
                    if (checked) {
                      ctx.fieldPropsFor("email").onChange("");
                    }
                    ctx.fieldPropsFor("noLandlordEmail").onChange(checked);
                  }}
                  labelClassName=""
                >
                  <Trans>I don't have this information</Trans>
                </CheckboxFormField>
              </div>
              {ctx.fieldPropsFor("noLandlordEmail").value && (
                <p className="is-small">
                  <Trans>
                    If your landlord or property manager normally contact you by
                    email, we recommend adding their email address above.
                  </Trans>
                </p>
              )}
              <EmailPreview
                emailContent={HabitabilityLetterEmailToLandlordForUser}
                landlordName={session.landlordDetails?.name}
                landlordEmail={session.landlordDetails?.email}
              />
              <ProgressButtons
                back={props.prevStep}
                isLoading={ctx.isLoading}
              />
              <p className="is-small">
                <Trans>
                  Not sure yet? You can sign back in later to send your letter.
                </Trans>
              </p>
            </>
          );
        }}
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
  const emailToLandlord =
    session.habitabilityLatestLetter?.emailToLandlord &&
    session.landlordDetails?.email;
  const title = userWillMail
    ? li18n._(t`Are you sure you want to mail the letter yourself?`)
    : li18n._(t`Mail letter now for free`);

  return (
    <Modal title={title} onCloseGoTo={BackOrUpOneDirLevel}>
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderSendLetterMutation}
        initialState={{}}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <div className="jf-laletterbuilder-send-options-modal">
            <h1>{title}</h1>
            {userWillMail ? (
              <>
                <p>
                  <Trans>
                    We recommend that you to go back and select “Mail for me”.
                    If you wish to send the letter yourself, continue to see
                    instructions.
                  </Trans>
                </p>
                {emailToLandlord && (
                  <p>
                    <span>
                      <Trans>We will email your letter to:</Trans>
                    </span>
                    <span>{session.landlordDetails!.email}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p>
                  <span>
                    <Trans>Mail your letter to:</Trans>{" "}
                  </span>
                  <span>{session.landlordDetails?.name}</span>
                  <span>{session.landlordDetails?.primaryLine}</span>
                  <span>{`${session.landlordDetails?.city}, ${session.landlordDetails?.state} ${session.landlordDetails?.zipCode}`}</span>
                </p>
                {emailToLandlord && (
                  <p>
                    <span>
                      <Trans>Email your letter to:</Trans>{" "}
                    </span>
                    <span>{session.landlordDetails!.email}</span>
                  </p>
                )}
              </>
            )}
            <br />
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
          </div>
        )}
      </SessionUpdatingFormSubmitter>
    </Modal>
  );
};
