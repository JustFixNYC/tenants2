import React from "react";
import {
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
} from "../util/letter-content-util";
import { QueryLoader } from "../networking/query-loader";
import { LetterStaticPage } from "../static-page/letter-static-page";
import { NorentLetterContentQuery } from "../queries/NorentLetterContentQuery";

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
    I need the following repairs in my home referenced below and/or in the
    common areas of the building:
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

const LocStaticPage: React.FC<
  { isPdf?: boolean; title: string } & LocContentProps
> = ({ isPdf, title, ...props }) => (
  <QueryLoader
    query={NorentLetterContentQuery}
    render={(output) => {
      return (
        <LetterStaticPage title={title} isPdf={isPdf} css={output.letterStyles}>
          <LocContent {...props} />
        </LetterStaticPage>
      );
    }}
    input={null}
    loading={() => null}
  />
);

export const LocSamplePage: React.FC<{ isPdf?: boolean }> = ({ isPdf }) => {
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
