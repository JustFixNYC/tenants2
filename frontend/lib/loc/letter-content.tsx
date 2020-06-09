import React from "react";
import {
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
} from "../util/letter-content-util";
import { createLetterStaticPageWithQuery } from "../static-page/letter-static-page";

type LocContentProps = BaseLetterContentProps;

const LetterTitle: React.FC<LocContentProps> = (props) => (
  <letter.Title>
    <span className="is-uppercase">Request for repairs</span>
    <letter.TitleNewline />
    at <letter.AddressLine {...props} />
  </letter.Title>
);

const LetterBody: React.FC<LocContentProps> = (props) => (
  <p>
    TODO: This needs to be implemented.
  </p>
);

export const LocContent: React.FC<LocContentProps> = (props) => (
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

const LocStaticPage = createLetterStaticPageWithQuery(LocContent);

export const LocSamplePage: React.FC<{ isPdf: boolean }> = ({ isPdf }) => {
  const props: LocContentProps = {
    ...baseSampleLetterProps,
  };

  return (
    <LocStaticPage
      {...props}
      title="Sample Letter of Complaint"
      isPdf={isPdf}
    />
  );
};
