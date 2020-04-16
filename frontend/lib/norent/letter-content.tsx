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

export type NorentLetterContentProps = AllSessionInfo_norentScaffolding;

export const NorentLetterContent: React.FC<NorentLetterContentProps> = (
  props
) => {
  const landlordName = props.landlordName.toUpperCase();
  const nonpayStartDate = friendlyDate(new Date(NONPAY_START_DATE));
  const fullName = `${props.firstName} ${props.lastName}`;

  return (
    <>
      {/*
       * We originally had a <br> in this <h1>, but React self-closes the
       * tag as <br/>, which WeasyPrint doesn't seem to like, so we'll
       * include an actual newline and set the style to preserve whitespace.
       */}
      <h1 className="has-text-right" style={{ whiteSpace: "pre" }}>
        <span className="is-uppercase">Notice of non-payment of rent</span>
        {"\n"}
        at {props.street}, {props.city}, {props.state} {props.zipCode}
      </h1>

      <p className="has-text-right">{friendlyDate(new Date())}</p>

      <dl className="jf-letter-heading">
        <dt>To</dt>
        <dd>
          {landlordName}
          <br />
          {props.landlordPrimaryLine}
          <br />
          {props.landlordCity}, {props.landlordState} {props.landlordZipCode}
        </dd>
        <dt>From</dt>
        <dd>
          {fullName}
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

      <p>Dear {landlordName},</p>

      <p>
        This letter is to notify you that I will be unable to pay rent starting
        on {nonpayStartDate} and until further notice due to loss of income,
        increased expenses, and/or other financial circumstances related to
        COVID-19.
      </p>

      <p>Thank you for your understanding and cooperation.</p>

      <p className="jf-signature">
        Regards,
        <br />
        <br />
        {fullName}
      </p>
    </>
  );
};

export const NorentLetterStaticPage: React.FC<{ isPdf?: boolean }> = ({
  isPdf,
}) => {
  const { norentScaffolding } = useContext(AppContext).session;

  if (!norentScaffolding) {
    return <Route component={NotFound} />;
  }

  return (
    <QueryLoader
      query={NorentLetterContentQuery}
      render={(output) => {
        return (
          <LetterStaticPage
            title="Your NoRent.org letter"
            isPdf={isPdf}
            css={output.letterStyles}
          >
            <NorentLetterContent {...norentScaffolding} />
          </LetterStaticPage>
        );
      }}
      input={null}
      loading={() => null}
    />
  );
};
