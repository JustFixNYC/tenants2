import React, { useContext } from "react";
import { createLetterStaticPageWithQuery } from "../static-page/letter-static-page";
import { AppContext } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { friendlyUTCDate, friendlyUTCMonthAndYear } from "../util/date-util";
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
  paymentDates: GraphQLDate[];
};

const componentizeHelper = makeStringHelperFC<NorentLetterContentProps>();

const LetterTitle: React.FC<NorentLetterContentProps> = (props) => (
  <letter.Title>
    {props.state === "CA" ? (
      <Trans>
        <span className="is-uppercase">
          Declaration of COVID-19 Related Financial Distress
        </span>
        <letter.TitleNewline />
        Compliant with Code of Civil Procedure Section 1179.02, SB91, COVID-19
        Tenant Relief Act
      </Trans>
    ) : (
      <Trans>
        <span className="is-uppercase">Notice of COVID-19 impact on rent</span>
        <letter.TitleNewline />
        at <letter.AddressLine {...props} />
      </Trans>
    )}
  </letter.Title>
);

const SinglePaymentDate = componentizeHelper((props) =>
  friendlyUTCDate(props.paymentDates[0])
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
              <letter.Signed />
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

export const NorentLetterEmailToLandlord: React.FC<BaseLetterContentProps> = (
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
    <Trans id="norent.emailToLandlordBody_v2">
      <p>
        Please see letter attached from <letter.FullName {...props} />.{" "}
      </p>
      <p>
        In order to document communications and avoid misunderstandings, please
        correspond with <letter.FullName {...props} /> via email at{" "}
        <span style={{ textDecoration: "underline" }}>{props.email}</span> or
        mail rather than a phone call or in-person visit.
      </p>
    </Trans>
    <letter.Regards />
    <p>
      <Trans>
        NoRent.org <br />
        sent on behalf of <letter.FullName {...props} />
      </Trans>
    </p>
  </>
);

const LetterBodyCalifornia: React.FC<NorentLetterContentProps> = (props) => {
  return (
    <Trans id="norent.letterBodyCaliforniaAB3088">
      <p>
        This declaration letter is in regards to rent payment for the following
        months:
      </p>
      <PaymentDateList dates={props.paymentDates} />
      <p>
        I am currently unable to pay my rent or other financial obligations
        under the lease in full because of one or more of the following:
      </p>
      <ol>
        <li>Loss of income caused by the COVID-19 pandemic.</li>
        <li>
          Increased out-of-pocket expenses directly related to performing
          essential work during the COVID-19 pandemic.
        </li>
        <li>
          Increased expenses directly related to health impacts of the COVID-19
          pandemic.
        </li>
        <li>
          Childcare responsibilities or responsibilities to care for an elderly,
          disabled, or sick family member directly related to the COVID-19
          pandemic that limit my ability to earn income.
        </li>
        <li>
          Increased costs for childcare or attending to an elderly, disabled, or
          sick family member directly related to the COVID-19 pandemic.
        </li>
        <li>
          Other circumstances related to the COVID-19 pandemic that have reduced
          my income or increased my expenses.
        </li>
        <li>
          Any public assistance, including unemployment insurance, pandemic
          unemployment assistance, state disability insurance (SDI), or paid
          family leave, that I have received since the start of the COVID-19
          pandemic does not fully make up for my loss of income and/or increased
          expenses.
        </li>
      </ol>
      <p className="jf-avoid-page-breaks-after">
        I declare under penalty of perjury under the laws of the State of
        California that the foregoing is true and correct.
      </p>
    </Trans>
  );
};

export const NorentLetterEmailToLandlordForUser: React.FC<{}> = () => (
  <TransformSession
    transformer={getBaseLetterContentPropsFromSession}
    children={(lcProps) => <NorentLetterEmailToLandlord {...lcProps} />}
  />
);

export const NorentLetterEmailToLandlordForUserStaticPage = asEmailStaticPage(
  NorentLetterEmailToLandlordForUser
);

const LetterBodyV1NonPayment: React.FC<NorentLetterContentProps> = (props) => {
  return props.paymentDates.length === 1 ? (
    <p>
      <Trans id="norent.letter.v1NonPayment">
        This letter is to notify you that I will be unable to pay rent starting
        on <SinglePaymentDate {...props} /> and until further notice due to loss
        of income, increased expenses, and/or other financial circumstances
        related to COVID-19.
      </Trans>
    </p>
  ) : (
    <>
      <p>
        <Trans id="norent.letter.v1NonPayment_multipleDates">
          This letter is to notify you that I will be unable to pay rent for the
          following months and until further notice due to loss of income,
          increased expenses, and/or other financial circumstances related to
          COVID-19:
        </Trans>
      </p>
      <PaymentDateList dates={props.paymentDates} />
    </>
  );
};

const PaymentDateList: React.FC<{ dates: GraphQLDate[] }> = ({ dates }) => (
  <ul>
    {dates.map((date) => (
      <li key={date}>{friendlyUTCMonthAndYear(date)}</li>
    ))}
  </ul>
);

const LetterBody: React.FC<NorentLetterContentProps> = (props) => {
  const state = props.state as USStateChoice;
  const letterVersion = getNorentMetadataForUSState(state).lawForLetter
    .whichVersion;

  if (state === "CA") return <LetterBodyCalifornia {...props} />;

  return (
    <>
      {letterVersion === CovidStateLawVersion.V1_NON_PAYMENT ? (
        <LetterBodyV1NonPayment {...props} />
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

export function chunkifyPropsForBizarreCaliforniaLawyers<
  T extends { state: string; paymentDates: string[] }
>(props: T): T[] {
  if (props.state !== "CA") {
    return [props];
  }

  let beforeSeptember2020: T | null = null;
  const september2020AndLater: T[] = [];

  for (let dateString of props.paymentDates) {
    const match = dateString.match(/^(\d\d\d\d)-(\d\d)/);
    if (!match) {
      throw new Error(`Could not parse date: ${dateString}`);
    }
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    if (year <= 2020 && month < 9) {
      if (!beforeSeptember2020) {
        beforeSeptember2020 = {
          ...props,
          paymentDates: [],
        };
      }
      beforeSeptember2020.paymentDates.push(dateString);
    } else {
      september2020AndLater.push({
        ...props,
        paymentDates: [dateString],
      });
    }
  }

  return beforeSeptember2020
    ? [beforeSeptember2020, ...september2020AndLater]
    : september2020AndLater;
}

export const NorentLetterContent: React.FC<NorentLetterContentProps> = (
  props
) => {
  return (
    <>
      <LetterTitle {...props} />
      {chunkifyPropsForBizarreCaliforniaLawyers(props).map((props, i) => (
        <div key={i} className="jf-page-break-after">
          <letter.TodaysDate {...props} />
          <letter.Addresses {...props} />
          <letter.DearLandlord {...props} />
          <LetterBody {...props} />
          <letter.Signed>
            <br />
            <br />
            <letter.FullName {...props} />
          </letter.Signed>
        </div>
      ))}
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

  const paymentDates = session.norentUpcomingLetterRentPeriods;

  if (paymentDates.length === 0) {
    console.log("User has no upcoming no rent letter rent periods defined!");
    return null;
  }

  const props: NorentLetterContentProps = {
    ...baseProps,
    paymentDates,
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
  paymentDates: ["2020-05-01T15:41:37.114Z"],
};

export const NorentSampleLetterSamplePage: React.FC<{ isPdf: boolean }> = ({
  isPdf,
}) => {
  const { session } = useContext(AppContext);
  const props: NorentLetterContentProps = {
    ...noRentSampleLetterProps,
    paymentDates:
      session.norentUpcomingLetterRentPeriods.length > 0
        ? session.norentUpcomingLetterRentPeriods
        : noRentSampleLetterProps.paymentDates,
  };
  return (
    <NorentLetterStaticPage
      {...props}
      title={li18n._(t`Sample NoRent.org letter`)}
      isPdf={isPdf}
    />
  );
};
