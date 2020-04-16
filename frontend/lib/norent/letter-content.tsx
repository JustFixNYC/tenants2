import React, { useContext } from "react";
import { QueryLoader } from "../networking/query-loader";
import { NorentLetterContentQuery } from "../queries/NorentLetterContentQuery";
import { LetterStaticPage } from "../static-page/letter-static-page";
import { AppContext } from "../app-context";
import { NotFound } from "../pages/not-found";
import { Route } from "react-router-dom";
import { AllSessionInfo_norentScaffolding } from "../queries/AllSessionInfo";

const LetterContent: React.FC<AllSessionInfo_norentScaffolding> = (props) => {
  return (
    <>
      <p>
        TODO: Create letter content for {props.firstName} {props.lastName}
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
            <LetterContent {...norentScaffolding} />
          </LetterStaticPage>
        );
      }}
      input={null}
      loading={() => null}
    />
  );
};
