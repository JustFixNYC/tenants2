import React from "react";
import { useContext } from "react";
import { AppContext } from "../app-context";
import Page from "../ui/page";

export const NycUsersOnly: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { session } = useContext(AppContext);

  if (session.onboardingInfo?.borough) {
    return <>{children}</>;
  }

  return (
    <Page title="We can't help you&hellip;yet!" withHeading="big">
      <p>
        Sorry, but this service currently only supports individuals in New York
        City.
      </p>
      <p>We'll let you know when we launch a service in your area.</p>
    </Page>
  );
};
