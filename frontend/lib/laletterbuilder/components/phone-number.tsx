import React from "react";
import { OutboundLink } from "../../ui/outbound-link";

type PhoneNumberProps = {
  number: string;
  countryCode?: string;
};

export const PhoneNumber: React.FC<PhoneNumberProps> = (props) => {
  const { number, countryCode } = props;
  // Strip anything that's not a digit
  const formattedNumber = number.replace(/[^\d]*/gi, "");
  return (
    <OutboundLink href={`tel:+${countryCode || "1"}${formattedNumber}`}>
      {number}
    </OutboundLink>
  );
};
