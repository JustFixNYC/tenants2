import React from "react";

type PhoneNumberProps = {
  number: string;
  countryCode?: string;
};

export const PhoneNumber: React.FC<PhoneNumberProps> = (props) => {
  const { number, countryCode } = props;
  // Strip anything that's not a digit
  const formattedNumber = number.replace(/[^\d]*/gi, "");
  return <a href={`tel:+${countryCode || "1"}${formattedNumber}`}>{number}</a>;
};
