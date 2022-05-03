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
  <>
    {props.state === "CA" ? (
      <>
        <letter.Title>
          <Trans>
            <span className="is-uppercase">
              Declaration of Financial Impacts Related to COVID-19
            </span>
          </Trans>
        </letter.Title>
        <Trans id="norent.letter.sectionvia1LACounty">
          <p>
            As required under section VI.A.1 of the January 25, 2022 Resolution
            of the Board of Supervisors of the County of Los Angeles Further
            Amending and Restating the County of Los Angeles COVID-19 Tenant
            Protections Resolution
          </p>
        </Trans>
      </>
    ) : (
      <letter.Title>
        <Trans>
          <span className="is-uppercase">
            Notice of COVID-19 impact on rent
          </span>
          <letter.TitleNewline />
          at <letter.AddressLine {...props} />
        </Trans>
      </letter.Title>
    )}
  </>
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
                <letter.FullLegalName {...props} />
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
        t`Notice of COVID-19 impact on Rent sent on behalf of ${letter.getFullLegalName(
          props
        )}`
      )}
    />
    <letter.DearLandlord {...props} />
    <Trans id="norent.emailToLandlordBody_v2">
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
        NoRent.org <br />
        sent on behalf of <letter.FullLegalName {...props} />
      </Trans>
    </p>
  </>
);

const LetterBodyCalifornia: React.FC<NorentLetterContentProps> = (props) => {
  return (
    <Trans id="norent.letterBodyCaliforniaLaCountyVIA1">
      <p>
        This declaration letter is in regards to rent payment for the following
        months:
      </p>
      <PaymentDateList dates={props.paymentDates} />
      <p>
        I am unable to pay the above months' rent due to a Financial Impact
        Related to COVID-19. I hereby certify that I have one of the following
        Financial Impacts:
      </p>
      <ol>
        <li>
          Substantial loss of household income caused by the COVID-19 pandemic;
        </li>
        <li>Loss of revenue or business due to business closure;</li>
        <li>Increased costs;</li>
        <li>
          Reduced revenues or other similar reasons impacting my ability to pay
          rent due;
        </li>
        <li>Loss of compensable hours of work or wages, or layoffs; or</li>
        <li>Extraordinary out-of-pocket medical expenses.</li>
      </ol>
      <p>
        The Financial Impact was related to COVID-19 in one or more of the
        following ways:
      </p>
      <ol>
        <li>
          A suspected or confirmed case of COVID-19, or caring for a household
          or family member who has a suspected or confirmed case of COVID-19;
        </li>
        <li>
          Lay-off, loss of compensable work hours, or other reduction or loss of
          income or revenue resulting from a business closure or other economic
          or employer impacts related to COVID-19;
        </li>
        <li>
          Compliance with an order or recommendation of the County’s Health
          Officer to stay at home, self-quarantine, or avoid congregating with
          others during the state of emergency;
        </li>
        <li>
          Extraordinary out-of-pocket medical expenses related to the diagnosis
          of, testing for, and/or treatment of COVID-19; or
        </li>
        <li>
          Childcare needs arising from school closures in response to COVID-19.
        </li>
      </ol>
      <p className="jf-avoid-page-breaks-after">
        This notice is being provided within seven (7) days of when the above
        months' rent was due. Or, if this notice is being provided later than
        seven (7) days after that date, extenuating circumstances exist which
        prevented me from providing this notice sooner.
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
            <letter.FullLegalName {...props} />
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
