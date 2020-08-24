import React, { useContext } from "react";
import { createLetterStaticPageWithQuery } from "../static-page/letter-static-page";
import { AppContext } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { friendlyUTCDate } from "../util/date-util";
import {
  EmailSubject,
  asEmailStaticPage,
} from "../static-page/email-static-page";
import {
  USStateChoice,
  getUSStateChoiceLabels,
} from "../../../common-data/us-state-choices";
import {
  getNorentMetadataForUSState,
  CovidStateLawVersion,
} from "./letter-builder/national-metadata";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import {
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
  getBaseLetterContentPropsFromSession,
} from "../util/letter-content-util";
import { makeStringHelperFC } from "../util/string-helper";
import { TransformSession } from "../util/transform-session";

export type NorentLetterContentProps = BaseLetterContentProps & {
  paymentDate: GraphQLDate;
};

const componentizeHelper = makeStringHelperFC<NorentLetterContentProps>();

const LetterTitle: React.FC<NorentLetterContentProps> = (props) => (
  <letter.Title>
    <Trans>
      <span className="is-uppercase">Notice of COVID-19 impact on rent</span>
      <letter.TitleNewline />
      at <letter.AddressLine {...props} />
    </Trans>
  </letter.Title>
);

const PaymentDate = componentizeHelper((props) =>
  friendlyUTCDate(props.paymentDate)
);

const TenantProtections: React.FC<NorentLetterContentProps> = (props) => {
  const state = props.state as USStateChoice;
  const protectionData = getNorentMetadataForUSState(state)?.lawForLetter;

  return (
    <>
      <p>
        {state === "FL" ? (
          <Trans>
            Tenants adversely affected by the COVID-19 crisis are protected from
            eviction for nonpayment per emergency declaration(s) from:
          </Trans>
        ) : (
          <Trans>
            Tenants impacted by the COVID-19 crisis are protected from eviction
            for nonpayment per emergency declaration(s) from:
          </Trans>
        )}
      </p>
      <ul>
        {protectionData &&
          protectionData.textOfLegislation.map((protection, i) => (
            <li key={i}>{protection}</li>
          ))}
      </ul>
    </>
  );
};

export const NorentLetterTranslation: React.FC<{}> = () => {
  return (
    <article className="message jf-letter-translation">
      <div className="message-body has-background-grey-lighter has-text-left has-text-weight-light">
        <TransformSession transformer={getNorentLetterContentPropsFromSession}>
          {(props) => (
            <>
              <letter.DearLandlord {...props} />
              <LetterBody {...props} />
              <letter.Regards />
              <p>
                <letter.FullName {...props} />
              </p>
            </>
          )}
        </TransformSession>
      </div>
    </article>
  );
};

export const NorentLetterEmailToLandlord: React.FC<NorentLetterContentProps> = (
  props
) => (
  <>
    <EmailSubject
      value={li18n._(
        t`Notice of COVID-19 impact on Rent sent on behalf of ${letter.getFullName(
          props
        )}`
      )}
    />
    <letter.DearLandlord {...props} />
    <Trans id="norent.emailToLandlordBody">
      <p>
        Please see letter attached from <letter.FullName {...props} />.{" "}
      </p>
      <p>
        In order to document communications and avoid misunderstandings, please
        correspond with <letter.FullName {...props} /> via mail or text rather
        than a phone call or in-person visit.
      </p>
    </Trans>
    <letter.Regards />
    <p>
      <Trans>
        JustFix.nyc <br />
        sent on behalf of <letter.FullName {...props} />
      </Trans>
    </p>
  </>
);

export const NorentLetterEmailToLandlordForUser: React.FC<{}> = () => (
  <TransformSession
    transformer={getNorentLetterContentPropsFromSession}
    children={(lcProps) => <NorentLetterEmailToLandlord {...lcProps} />}
  />
);

export const NorentLetterEmailToLandlordForUserStaticPage = asEmailStaticPage(
  NorentLetterEmailToLandlordForUser
);

const LetterBody: React.FC<NorentLetterContentProps> = (props) => {
  const state = props.state as USStateChoice;
  const letterVersion = getNorentMetadataForUSState(state).lawForLetter
    .whichVersion;

  return (
    <>
      {letterVersion === CovidStateLawVersion.V1_NON_PAYMENT ? (
        <p>
          <Trans id="norent.letter.v1NonPayment">
            This letter is to notify you that I will be unable to pay rent
            starting on <PaymentDate {...props} /> and until further notice due
            to loss of income, increased expenses, and/or other financial
            circumstances related to COVID-19.
          </Trans>
        </p>
      ) : letterVersion === CovidStateLawVersion.V2_HARDSHIP ? (
        <p>
          <Trans id="norent.letter.v2Hardship">
            This letter is to notify you that I have experienced a loss of
            income, increased expenses and/or other financial circumstances
            related to the pandemic. Until further notice, the COVID-19
            emergency may impact my ability to pay rent. I am not waiving my
            right to assert any other defenses.
          </Trans>
        </p>
      ) : (
        // Letter Copy for V3_FEW_PROTECTIONS, the default:
        <p>
          <Trans id="norent.letter.v3FewProtections">
            This letter is to advise you of protections in place for tenants in{" "}
            {getUSStateChoiceLabels()[state]}. I am not waiving my right to
            assert any other defenses.
          </Trans>
        </p>
      )}
      <TenantProtections {...props} />

      {state === "FL" && (
        <p>
          <Trans id="norent.letter.floridaAddition">
            I have suffered a loss of employment, diminished wages or business
            income, or other monetary loss realized during the Florida State of
            Emergency directly impacting my ability to make rent payments.
          </Trans>
        </p>
      )}

      <Trans id="norent.letter.conclusion">
        <p>
          Congress passed the CARES Act on March 27, 2020 (Public Law 116-136).
          Tenants in covered properties are also protected from eviction for
          non-payment or any other reason until August 23, 2020. Please let me
          know right away if you believe this property is not covered by the
          CARES Act and explain why the property is not covered.
        </p>
        <p>
          In order to document our communication and to avoid misunderstandings,
          please reply to me via mail or text rather than a call or visit.
        </p>
        <p>Thank you for your understanding and cooperation.</p>
      </Trans>
    </>
  );
};

export const NorentLetterContent: React.FC<NorentLetterContentProps> = (
  props
) => {
  return (
    <>
      <LetterTitle {...props} />
      <letter.TodaysDate {...props} />
      <letter.Addresses {...props} />
      <letter.DearLandlord {...props} />
      <LetterBody {...props} />
      <letter.Regards>
        <br />
        <br />
        <letter.FullName {...props} />
      </letter.Regards>
    </>
  );
};

const NorentLetterStaticPage = createLetterStaticPageWithQuery(
  NorentLetterContent
);

function getNorentLetterContentPropsFromSession(
  session: AllSessionInfo
): NorentLetterContentProps | null {
  const baseProps = getBaseLetterContentPropsFromSession(session);

  if (!baseProps) {
    return null;
  }

  const paymentDate = session.norentLatestRentPeriod?.paymentDate;

  if (!paymentDate) {
    console.log(
      "No latest rent period defined! Please create one in the admin."
    );
    return null;
  }

  const props: NorentLetterContentProps = {
    ...baseProps,
    paymentDate,
  };

  return props;
}

export const NorentLetterForUserStaticPage: React.FC<{ isPdf: boolean }> = ({
  isPdf,
}) => (
  <TransformSession
    transformer={getNorentLetterContentPropsFromSession}
    children={(lcProps) => (
      <NorentLetterStaticPage
        {...lcProps}
        isPdf={isPdf}
        title={li18n._(t`Your NoRent.org letter`)}
      />
    )}
  />
);

export const noRentSampleLetterProps: NorentLetterContentProps = {
  ...baseSampleLetterProps,
  paymentDate: "2020-05-01T15:41:37.114Z",
};

export const NorentSampleLetterSamplePage: React.FC<{ isPdf: boolean }> = ({
  isPdf,
}) => {
  const { session } = useContext(AppContext);
  const props: NorentLetterContentProps = {
    ...noRentSampleLetterProps,
    paymentDate:
      session.norentLatestRentPeriod?.paymentDate ||
      noRentSampleLetterProps.paymentDate,
  };
  return (
    <NorentLetterStaticPage
      {...props}
      title={li18n._(t`Sample NoRent.org letter`)}
      isPdf={isPdf}
    />
  );
};
