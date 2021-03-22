import React from "react";
import { OutboundLink } from "./outbound-link";

const CUSTOMER_SUPPORT_EMAIL = "support@justfix.nyc";

function EmailLink({ email }: { email: string }) {
  return <OutboundLink href={`mailto:${email}`}>{email}</OutboundLink>;
}

export function CustomerSupportLink(props: {}) {
  return <EmailLink email={CUSTOMER_SUPPORT_EMAIL} />;
}
