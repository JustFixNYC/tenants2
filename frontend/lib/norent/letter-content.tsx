import React, { useContext } from "react";
import { QueryLoader } from "../networking/query-loader";
import { NorentLetterContentQuery } from "../queries/NorentLetterContentQuery";
import { LetterStaticPage } from "../static-page/letter-static-page";
import { AppContext } from "../app-context";
import { NotFound } from "../pages/not-found";
import { Route } from "react-router-dom";
import { AllSessionInfo_norentScaffolding } from "../queries/AllSessionInfo";
import { friendlyDate } from "../util/util";
import { formatPhoneNumber } from "../forms/phone-number-form-field";

// TODO: This is temporary, it should be passed in as a prop.
const NONPAY_START_DATE = "2020-05-01T15:41:37.114Z";

export type NorentLetterContentProps = Omit<
  AllSessionInfo_norentScaffolding,
  "isCityInNyc"
>;

const LandlordName: React.FC<NorentLetterContentProps> = (props) => (
  <>{props.landlordName.toUpperCase()}</>
);

const FullName: React.FC<NorentLetterContentProps> = (props) => (
  <>
    {props.firstName} {props.lastName}
  </>
);

const LetterTitle: React.FC<NorentLetterContentProps> = (props) => (
  /*
   * We originally had a <br> in this <h1>, but React self-closes the
   * tag as <br/>, which WeasyPrint doesn't seem to like, so we'll
   * include an actual newline and set the style to preserve whitespace.
   */
  <h1 className="has-text-right" style={{ whiteSpace: "pre-wrap" }}>
    <span className="is-uppercase">Notice of non-payment of rent</span>
    {"\n"}
    at {props.street}, {props.city}, {props.state} {props.zipCode}
  </h1>
);

const LetterHeading: React.FC<NorentLetterContentProps> = (props) => (
  <dl className="jf-letter-heading">
    <dt>To</dt>
    <dd>
      <LandlordName {...props} />
      <br />
      {props.landlordPrimaryLine}
      <br />
      {props.landlordCity}, {props.landlordState} {props.landlordZipCode}
    </dd>
    <dt>From</dt>
    <dd>
      <FullName {...props} />
      <br />
      {props.street}
      <br />
      {props.city}, {props.state} {props.zipCode}
      <br />
      {formatPhoneNumber(props.phoneNumber)}
      <br />
      {props.email}
    </dd>
  </dl>
);

const TenantProtections: React.FC<{}> = () => (
  <>
    <p>
      Tenants impacted by the COVID-19 crisis are protected from eviction for
      nonpayment per emergency declaration(s) from:
    </p>
    <ul>
      <li>US Congress, CARES Act (Title IV, Sec. 4024), March 27, 2020</li>
    </ul>
  </>
);

export const NorentLetterContent: React.FC<NorentLetterContentProps> = (
  props
) => {
  const nonpayStartDate = friendlyDate(new Date(NONPAY_START_DATE));

  return (
    <>
      <LetterTitle {...props} />
      <p className="has-text-right">{friendlyDate(new Date())}</p>
      <LetterHeading {...props} />
      <p>
        Dear <LandlordName {...props} />,
      </p>
      <p>
        This letter is to notify you that I will be unable to pay rent starting
        on {nonpayStartDate} and until further notice due to loss of income,
        increased expenses, and/or other financial circumstances related to
        COVID-19.
      </p>
      <TenantProtections />
      <p>
        In order to document our communication and to avoid misunderstandings,
        please reply to me via email or text rather than a call or visit.
      </p>
      <p>Thank you for your understanding and cooperation.</p>
      <p className="jf-signature">
        Regards,
        <br />
        <br />
        <FullName {...props} />
      </p>
    </>
  );
};

const NorentLetterStaticPage: React.FC<
  { isPdf?: boolean; title: string } & NorentLetterContentProps
> = ({ isPdf, title, ...props }) => (
  <QueryLoader
    query={NorentLetterContentQuery}
    render={(output) => {
      return (
        <LetterStaticPage title={title} isPdf={isPdf} css={output.letterStyles}>
          <NorentLetterContent {...props} />
        </LetterStaticPage>
      );
    }}
    input={null}
    loading={() => null}
  />
);

export const NorentLetterForUserStaticPage: React.FC<{ isPdf?: boolean }> = ({
  isPdf,
}) => {
  const { norentScaffolding } = useContext(AppContext).session;

  if (!norentScaffolding) {
    return <Route component={NotFound} />;
  }

  return (
    <NorentLetterStaticPage
      {...norentScaffolding}
      isPdf={isPdf}
      title="Your NoRent.org letter"
    />
  );
};

export const noRentSampleLetterProps: NorentLetterContentProps = {
  firstName: "Boop",
  lastName: "Jones",
  street: "654 Park Place",
  city: "Brooklyn",
  state: "NY",
  zipCode: "12345",
  aptNumber: "2",
  email: "boop@jones.com",
  phoneNumber: "5551234567",
  landlordName: "Landlordo Calrissian",
  landlordPrimaryLine: "1 Cloud City Drive",
  landlordCity: "Bespin",
  landlordState: "OH",
  landlordZipCode: "41235",
  landlordEmail: "landlordo@calrissian.net",
  landlordPhoneNumber: "5552003000",
};

export const NorentSampleLetterSamplePage: React.FC<{ isPdf?: boolean }> = ({
  isPdf,
}) => (
  <NorentLetterStaticPage
    {...noRentSampleLetterProps}
    title="Sample NoRent.org letter"
    isPdf={isPdf}
  />
);
