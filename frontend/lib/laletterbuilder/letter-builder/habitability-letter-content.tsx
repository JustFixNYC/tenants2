import { t, Trans } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import {
  asEmailStaticPage,
  EmailSubject,
} from "../../static-page/email-static-page";
import { createLetterStaticPageWithQuery } from "../../static-page/letter-static-page";
import {
  getBaseLetterContentPropsFromSession,
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
} from "../../util/letter-content-util";
import { TransformSession } from "../../util/transform-session";

export type HabitabilityLetterContentProps = BaseLetterContentProps; // TODO: add in any necessary extra props

const LetterTitle: React.FC<HabitabilityLetterContentProps> = (props) => (
  <letter.Title>
    <Trans>Habitability</Trans>
  </letter.Title>
);

export const HabitabilityLetterEmailToLandlordForUser: React.FC<{}> = () => (
  <TransformSession
    transformer={getBaseLetterContentPropsFromSession}
    children={(lcProps) => <HabitabilityLetterEmailToLandlord {...lcProps} />}
  />
);

export const HabitabilityLetterEmailToLandlordForUserStaticPage = asEmailStaticPage(
  HabitabilityLetterEmailToLandlordForUser
);

export const HabitabilityLetterEmailToLandlord: React.FC<BaseLetterContentProps> = (
  props
) => (
  <>
    <EmailSubject
      value={li18n._(
        t`Habitability notice sent on behalf of ${letter.getFullLegalName(
          props
        )}`
      )}
    />
    <letter.DearLandlord {...props} />
    <Trans id="laletterbuilder.emailToLandlordBody">
      <p>
        Please see letter attached from <letter.FullLegalName {...props} />.{" "}
      </p>
      <p>
        In order to document communications and avoid misunderstandings, please
        correspond with <letter.FullLegalName {...props} /> via email at{" "}
        <span style={{ textDecoration: "underline" }}>{props.email}</span> or
        mail rather than a phone call or in-person visit.
      </p>
    </Trans>
    <letter.Regards />
    <p>
      <Trans>
        LaLetterBuilder.org <br />
        sent on behalf of <letter.FullLegalName {...props} />
      </Trans>
    </p>
  </>
);

export const HabitabilityLetterTranslation: React.FC<{}> = () => {
  return (
    <article className="message jf-letter-translation">
      <div className="message-body has-background-grey-lighter has-text-left has-text-weight-light">
        <TransformSession
          transformer={getHabitabilityLetterContentPropsFromSession}
        >
          {(props) => (
            <>
              <letter.DearLandlord {...props} />
              <LetterBody {...props} />
              <letter.Signed />
              <p>
                <letter.FullLegalName {...props} />
              </p>
            </>
          )}
        </TransformSession>
      </div>
    </article>
  );
};

export const HabitabilityLetterContent: React.FC<HabitabilityLetterContentProps> = (
  props
) => {
  return (
    <>
      <LetterTitle {...props} />
      <div className="jf-page-break-after">
        <letter.TodaysDate {...props} />
        <letter.Addresses {...props} />
        <letter.DearLandlord {...props} />
        <LetterBody {...props} />
        <letter.Signed>
          <br />
          <br />
          <letter.FullLegalName {...props} />
        </letter.Signed>
      </div>
    </>
  );
};

const HabitabilityLetterStaticPage = createLetterStaticPageWithQuery(
  HabitabilityLetterContent
);

function getHabitabilityLetterContentPropsFromSession(
  session: AllSessionInfo
): HabitabilityLetterContentProps | null {
  const baseProps = getBaseLetterContentPropsFromSession(session);

  if (!baseProps) {
    return null;
  }

  const props: HabitabilityLetterContentProps = {
    ...baseProps,
  };

  return props;
}

export const HabitabilityLetterForUserStaticPage: React.FC<{
  isPdf: boolean;
}> = ({ isPdf }) => (
  <TransformSession
    transformer={getHabitabilityLetterContentPropsFromSession}
    children={(lcProps) => (
      <HabitabilityLetterStaticPage
        {...lcProps}
        isPdf={isPdf}
        title={li18n._(t`Your NoRent.org letter`)}
      />
    )}
  />
);

const LetterBody: React.FC<HabitabilityLetterContentProps> = (props) => {
  return (
    <>
      <p>LETTER TEXT</p>
    </>
  );
};

export const habitabilitySampleLetterProps: HabitabilityLetterContentProps = {
  ...baseSampleLetterProps, // TODO: add repair issues, etc props here
};

export const HabitabilitySampleLetterSamplePage: React.FC<{
  isPdf: boolean;
}> = ({ isPdf }) => {
  const props: HabitabilityLetterContentProps = {
    ...habitabilitySampleLetterProps,
  };
  return (
    <HabitabilityLetterStaticPage
      {...props}
      title={li18n._(t`Sample Habitability letter`)}
      isPdf={isPdf}
    />
  );
};
