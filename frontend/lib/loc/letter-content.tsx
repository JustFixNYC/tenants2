import React from "react";
import {
  BaseLetterContentProps,
  letter,
  baseSampleLetterProps,
  getBaseLetterContentPropsFromSession,
} from "../util/letter-content-util";
import { createLetterStaticPageWithQuery } from "../static-page/letter-static-page";
import {
  IssueAreaChoice,
  getIssueAreaChoiceLabels,
  IssueAreaChoices,
} from "../../../common-data/issue-area-choices";
import {
  IssueChoice,
  getIssueChoiceLabels,
} from "../../../common-data/issue-choices";
import { friendlyUTCDate } from "../util/date-util";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { issuesForArea, customIssuesForArea } from "../issues/issues";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import { TransformSession } from "../util/transform-session";

const HEAT_ISSUE_CHOICES = new Set<IssueChoice>([
  "HOME__NO_HEAT",
  "HOME__NO_HOT_WATER",
  "PUBLIC_AREAS__NO_HEAT",
  "PUBLIC_AREAS__NO_HOT_WATER",
]);

type Issue =
  | { kind: "choice"; choice: IssueChoice }
  | { kind: "custom"; value: string };

type AreaIssues = {
  area: IssueAreaChoice;
  issues: Issue[];
};

type LocContentProps = BaseLetterContentProps & {
  issues: AreaIssues[];
  accessDates: GraphQLDate[];
  hasCalled311: boolean | null;
  workOrderTickets: string[] | null;
};

const LetterTitle: React.FC<LocContentProps> = (props) => (
  <letter.Title>
    <span className="is-uppercase">Request for repairs</span>
    <letter.TitleNewline />
    at <letter.AddressLine {...props} />
  </letter.Title>
);

const AreaIssues: React.FC<LocContentProps> = (props) => {
  const areaLabels = getIssueAreaChoiceLabels();
  const issueLabels = getIssueChoiceLabels();

  return (
    <>
      <p>
        I need the following repairs in my home referenced below and/or in the
        common areas of the building:
      </p>

      <h2>Repairs required</h2>

      {props.issues.map((areaIssues) => (
        <React.Fragment key={areaIssues.area}>
          <h3>{areaLabels[areaIssues.area]}</h3>
          <ul>
            {areaIssues.issues.map((issue, i) => (
              <li key={i}>
                {issue.kind === "choice"
                  ? issueLabels[issue.choice]
                  : issue.value}
              </li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </>
  );
};

const AccessDates: React.FC<LocContentProps> = (props) => (
  <div className="jf-avoid-page-breaks-within">
    <h2>Available access dates</h2>
    <p>
      Below are dates that I am available to be at my home to let in a repair
      worker. Please contact me (using the information provided at the top of
      this letter) in order to make arrangements with me{" "}
      <strong>at least 24 hours in advance</strong>.
    </p>
    <ul>
      {props.accessDates.map((date) => (
        <li key={date}>{friendlyUTCDate(date)}</li>
      ))}
    </ul>
  </div>
);

const WorkOrderTickets: React.FC<LocContentProps> = (props) => (
  <div className="jf-avoid-page-breaks-within">
    <h2>Work Order Repair Tickets</h2>
    <p>
      I have documented these issues in the past by submitting work tickets to
      management. I've included at least one work ticket(s) for your reference:
    </p>
    <ul>
      {props.workOrderTickets?.map((ticket) => (
        <li key={ticket}>{ticket}</li>
      ))}
    </ul>
  </div>
);

function hasHeatIssues(issues: AreaIssues[]): boolean {
  return issues.some((areaIssues) =>
    areaIssues.issues.some(
      (issue) => issue.kind == "choice" && HEAT_ISSUE_CHOICES.has(issue.choice)
    )
  );
}

const Requirements: React.FC<LocContentProps> = (props) => (
  <div className="jf-avoid-page-breaks-within">
    <h2>Requirements</h2>
    <p>
      I request that you provide the name and contact information for any repair
      worker assigned to my home at least 24 hours prior to their arrival.
    </p>
    {hasHeatIssues(props.issues) && (
      <p>
        Please be advised that the lack of Heat and/or Hot Water constitutes an
        emergency under the NYC Housing Maintenance Code, Title 27, Chapter 2.
        Failure to address these repairs will result in an escalation of this
        issue, and I may exercise my right to file an Emergency HP Action
        through the NYC Housing Court system.
      </p>
    )}
  </div>
);

const PreviousReliefAttempts: React.FC<{}> = () => (
  <div className="jf-avoid-page-breaks-within">
    <h2>Previous Attempts for Relief</h2>
    <p>
      I have already contacted 311 on several occasions, but the issue has not
      been resolved. In the meantime, I have recorded evidence of the violations
      should legal action be necessary.
    </p>
  </div>
);

const LetterBody: React.FC<LocContentProps> = (props) => (
  <>
    {props.issues.length > 0 && <AreaIssues {...props} />}
    {props.accessDates.length > 0 && <AccessDates {...props} />}
    <Requirements {...props} />
    {props.hasCalled311 && <PreviousReliefAttempts />}
    {props.workOrderTickets?.length && <WorkOrderTickets {...props} />}
  </>
);

const LetterConclusion: React.FC<LocContentProps> = (props) => (
  <>
    <div className="jf-avoid-page-breaks-within">
      <h2>Civil penalties</h2>
      <p>
        Pursuant to NYC Admin Code § 27-2115 an order of civil penalties for all
        existing violations for which the time to correct has expired is as
        follows:
      </p>
      <dl>
        <dt>“C” Violation</dt>
        <dd>
          $50 per day per violation (if 1-5 units)
          <br />
          $50-$150 one-time penalty per violation plus $125 per day (5 or more
          units)
        </dd>
        <dt>“B” Violation:</dt>
        <dd>$25-$100 one-time penalty per violation plus $10 per day</dd>
        <dt>“A” Violation”</dt>
        <dd>$10-$50 one-time penalty per violation</dd>
      </dl>
    </div>
    <div className="jf-avoid-page-breaks-within">
      <p>
        According to the NYC Admin Code § 27-2115, a civil penalty is also
        issued where a person willfully makes a false certification of
        correction of a violation per violation falsely certified.
      </p>
      <p>
        Please contact me as soon as possible to arrange a time to have these
        repairs made at {formatPhoneNumber(props.phoneNumber)}.
      </p>
      <letter.Regards>
        <br />
        <br />
        <letter.FullLegalName {...props} />
      </letter.Regards>
    </div>
  </>
);

export const LocContent: React.FC<LocContentProps> = (props) => (
  <>
    <LetterTitle {...props} />
    <letter.TodaysDate {...props} />
    <letter.Addresses {...props} />
    <letter.DearLandlord {...props} />
    <LetterBody {...props} />
    <LetterConclusion {...props} />
  </>
);

const LocStaticPage = createLetterStaticPageWithQuery(LocContent);

function getIssuesFromSession(session: AllSessionInfo): AreaIssues[] {
  const result: AreaIssues[] = [];

  for (let area of IssueAreaChoices) {
    const issueChoices: Issue[] = issuesForArea(
      area,
      session.issues as IssueChoice[]
    ).map((choice) => ({
      kind: "choice",
      choice,
    }));
    const customIssues: Issue[] = customIssuesForArea(
      area,
      session.customIssuesV2 || []
    ).map((ci) => ({
      kind: "custom",
      value: ci.description,
    }));
    const issues: Issue[] = [...issueChoices, ...customIssues];
    if (issues.length) {
      result.push({ area, issues });
    }
  }

  return result;
}

export function getLocContentPropsFromSession(
  session: AllSessionInfo
): LocContentProps | null {
  const baseProps = getBaseLetterContentPropsFromSession(session);
  const onb = session.onboardingInfo;

  if (!(baseProps && onb)) {
    return null;
  }

  return {
    ...baseProps,
    issues: getIssuesFromSession(session),
    accessDates: session.accessDates,
    hasCalled311: onb.hasCalled311,
    workOrderTickets: session.workOrderTickets,
  };
}

export const LocForUserPage: React.FC<{ isPdf: boolean }> = ({ isPdf }) => (
  <TransformSession transformer={getLocContentPropsFromSession}>
    {(props) => (
      <LocStaticPage
        {...props}
        isPdf={isPdf}
        title="Your Letter of Complaint"
      />
    )}
  </TransformSession>
);

export const locSampleProps: LocContentProps = {
  ...baseSampleLetterProps,
  issues: [
    {
      area: "HOME",
      issues: [
        { kind: "choice", choice: "HOME__NO_HEAT" },
        { kind: "custom", value: "Hole in ceiling" },
      ],
    },
  ],
  accessDates: ["2020-05-01", "2020-05-02"],
  hasCalled311: true,
  workOrderTickets: ["BOOPBOOP"],
};

export const LocSamplePage: React.FC<{ isPdf: boolean }> = ({ isPdf }) => {
  return (
    <LocStaticPage
      {...locSampleProps}
      title="Sample Letter of Complaint"
      isPdf={isPdf}
    />
  );
};
