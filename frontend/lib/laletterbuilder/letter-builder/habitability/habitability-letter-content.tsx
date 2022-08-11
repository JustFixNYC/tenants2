import { t, Trans } from "@lingui/macro";
import React from "react";
import { li18n } from "../../../i18n-lingui";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";
import {
  asEmailStaticPage,
  EmailSubject,
} from "../../../static-page/email-static-page";
import { createLetterStaticPageWithQuery } from "../../../static-page/letter-static-page";
import {
  getBaseLetterContentPropsFromSession,
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
} from "../../../util/letter-content-util";
import { TransformSession } from "../../../util/transform-session";
import { friendlyUTCDate } from "../../../util/date-util";
import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
} from "../../../../../common-data/issue-choices-laletterbuilder";
import { getLaIssueRoomChoiceLabels } from "../../../../../common-data/issue-room-choices-laletterbuilder";
import { getIssue, getRoom } from "./issues";

type Issue = {
  issueLabel: string;
  roomLabels: string[];
};
export type HabitabilityLetterContentProps = BaseLetterContentProps & {
  accessDates: GraphQLDate[];
  issues: Issue[];
};

const LetterTitle: React.FC<HabitabilityLetterContentProps> = (props) => (
  <letter.Title>
    <Trans>Notice to Repair</Trans>
  </letter.Title>
);

export const HabitabilityLetterEmailToLandlordForUser: React.FC<{}> = () => (
  <TransformSession
    transformer={getBaseLetterContentPropsFromSession}
    children={(lcProps) => <HabitabilityLetterEmailToLandlord {...lcProps} />}
  />
);

export const HabitabilityLetterEmailToLandlordForUserStaticPage = asEmailStaticPage(
  HabitabilityLetterEmailToLandlordForUser
);

export const HabitabilityLetterEmailToLandlord: React.FC<BaseLetterContentProps> = (
  props
) => (
  <>
    <EmailSubject
      value={li18n._(
        t`Note to repair sent on behalf of ${letter.getFullLegalName(props)}`
      )}
    />
    <letter.DearLandlord {...props} />
    <Trans id="laletterbuilder.emailToLandlordBody">
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
        latenants.justfix.org <br />
        sent on behalf of <letter.FullLegalName {...props} />
      </Trans>
    </p>
  </>
);

export const HabitabilityLetterTranslation: React.FC<{}> = () => {
  return (
    <article className="message jf-letter-translation">
      <div className="message-body has-text-left">
        <TransformSession
          transformer={getHabitabilityLetterContentPropsFromSession}
        >
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

export const HabitabilityLetterContent: React.FC<HabitabilityLetterContentProps> = (
  props
) => {
  return (
    <>
      <LetterTitle {...props} />
      <div className="jf-page-break-after">
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
    </>
  );
};

const HabitabilityLetterStaticPage = createLetterStaticPageWithQuery(
  HabitabilityLetterContent
);

export function getHabitabilityLetterContentPropsFromSession(
  session: AllSessionInfo
): HabitabilityLetterContentProps | null {
  const baseProps = getBaseLetterContentPropsFromSession(session);

  if (!baseProps) {
    return null;
  }

  const props: HabitabilityLetterContentProps = {
    ...baseProps,
    accessDates: session.accessDates,
    issues: getIssuesFromSession(session.laIssues as LaIssueChoice[]),
  };

  return props;
}

export const HabitabilityLetterForUserStaticPage: React.FC<{
  isPdf: boolean;
}> = ({ isPdf }) => (
  <TransformSession
    transformer={getHabitabilityLetterContentPropsFromSession}
    children={(lcProps) => (
      <HabitabilityLetterStaticPage
        {...lcProps}
        isPdf={isPdf}
        title={li18n._(t`Your Notice to Repair letter`)}
      />
    )}
  />
);

const LetterBody: React.FC<HabitabilityLetterContentProps> = (props) => {
  return (
    <>
      <p>
        <Trans id="laletterbuilder.habitability.intro-1">
          This letter is to notify you that I need the following repairs in my
          home referenced below and/or in the public areas of the building:
        </Trans>
      </p>
      <RepairIssues {...props} />
      <div className="jf-avoid-page-breaks-within">
        <h2>
          <Trans id="laletterbuilder.habitability.access-title">
            Available access dates
          </Trans>
        </h2>
        <p>
          <Trans id="laletterbuilder.habitability.access-intro">
            Below are dates that I am available to be at my home to let in a
            repair worker. Please contact me (using the information provided at
            the top of this letter) in order to make arrangements.
          </Trans>
        </p>
        <p>
          <Trans id="laletterbuilder.habitability.access-warning">
            Be advised that you are required by law to provide a{" "}
            <strong>24-hour written notice of intent</strong> to enter the unit
            to make repairs pursuant California Civil Code 1954. Anyone coming
            to perform a repair inspection and/or repairs should arrive on the
            date and time mutually agreed upon.
          </Trans>
        </p>
        <ul>
          {props.accessDates.map((date) => (
            <li key={date}>{friendlyUTCDate(date)}</li>
          ))}
        </ul>
      </div>
      <p>
        <Trans id="laletterbuilder.habitability.consequences">
          You have 10 business days from the date of this letter to address the
          repairs outlined. If the repairs are not initiated and/or completed
          within this reasonable timeframe, I will have to report my
          habitability issues to the Los Angeles Housing and Community
          Investment Department (HCID), the Los Angeles Department of Public
          Health/(LADPH) and the Department of Building and Safety (LADBS).
        </Trans>
      </p>
    </>
  );
};

const RepairIssues: React.FC<HabitabilityLetterContentProps> = (props) => {
  const comp = (
    <section>
      <Trans>
        <h2>Repairs required</h2>
      </Trans>
      <ol>
        {props.issues.map(({ issueLabel, roomLabels }, i) => (
          <li key={i}>
            <b>{issueLabel}</b>
            <ul>
              {roomLabels.map((roomLabel, j) => (
                <li key={j}>{roomLabel}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
  return comp;
};

/**
 * Reformats the repair issues from
 * ["HEALTH_MOLD_KITCHEN", "HEALTH_MOLD_BEDROOM"]
 * to
 * [
 *    {
 *      issueLabel: "Mold",
 *      roomLabels: ["Kitchen", "Bedroom"]
 *    }
 * ]
 * for easier display.
 */
function getIssuesFromSession(sessionIssues: LaIssueChoice[]): Issue[] {
  const result: Issue[] = [];
  const issuesDict = groupChoicesByIssue(sessionIssues);

  const issueLabelTable = getLaIssueChoiceLabels();
  const roomLabelTable = getLaIssueRoomChoiceLabels();
  for (let key in issuesDict) {
    const choiceList = issuesDict[key];
    result.push({
      issueLabel: issueLabelTable[choiceList[0]],
      roomLabels: choiceList.map((choice) => roomLabelTable[getRoom(choice)]),
    });
  }
  return result;
}

/**
 * Takes a string[] and creates a dict like:
 * {
 *   "Mold": ["HEALTH_MOLD_KITCHEN", "HEALTH_MOLD_BATHROOM"]
 * }
 * as an interim step to creating the dict with display labels.
 * @param sessionIssues
 * @returns
 */
function groupChoicesByIssue(
  sessionIssues: LaIssueChoice[]
): { [issue: string]: LaIssueChoice[] } {
  let dict: { [issue: string]: LaIssueChoice[] } = {};
  for (let issue of sessionIssues) {
    const issueName = getIssue(issue);
    if (!dict.hasOwnProperty(getIssue(issue))) {
      dict[issueName] = [issue];
    } else {
      dict[issueName].push(issue);
    }
  }
  return dict;
}

/**
 * Used for tests
 */
export const habitabilitySampleLetterProps: HabitabilityLetterContentProps = {
  ...baseSampleLetterProps,
  accessDates: ["2022-05-01", "2023-05-02"],
  issues: [{ issueLabel: "Peeling paint", roomLabels: ["Bedroom", "Kitchen"] }],
};

/**
 * Used for tests
 */
export const HabitabilitySampleLetterSamplePage: React.FC<{
  isPdf: boolean;
}> = ({ isPdf }) => {
  const props: HabitabilityLetterContentProps = {
    ...habitabilitySampleLetterProps,
  };
  return (
    <HabitabilityLetterStaticPage
      {...props}
      title={li18n._(t`Sample Notice to Repair letter`)}
      isPdf={isPdf}
    />
  );
};
