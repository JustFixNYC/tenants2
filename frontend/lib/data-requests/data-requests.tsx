import React from "react";
import { RouteComponentProps, Switch, Route, Redirect } from "react-router";
import Page, { PageTitle } from "../ui/page";
import JustfixRoutes from "../justfix-routes";
import {
  DataRequestMultiLandlordQuery,
  DataRequestMultiLandlordQuery_output,
} from "../queries/DataRequestMultiLandlordQuery";
import { TextualFormField } from "../forms/form-fields";
import { NextButton } from "../ui/buttons";
import { WhoOwnsWhatLink } from "../ui/wow-link";
import {
  QueryFormSubmitter,
  useQueryFormResultFocusProps,
} from "../forms/query-form-submitter";

const BASE_TITLE = "Multi-landlord data request";

type SearchResultsProps = {
  query: string;
  output: DataRequestMultiLandlordQuery_output | null;
};

function getColumnValue(name: string, value: string): JSX.Element | string {
  if (name.toLowerCase() === "bbl") {
    return <WhoOwnsWhatLink bbl={value}>{value}</WhoOwnsWhatLink>;
  } else if (name === "error") {
    return (
      <span
        className="has-text-danger"
        style={{ fontFamily: "monospace", whiteSpace: "pre" }}
      >
        {value}
      </span>
    );
  }
  return value;
}

function SearchResults({ output, query }: SearchResultsProps) {
  const queryFormResultFocusProps = useQueryFormResultFocusProps();
  const quotedQuery = `\u201c${query}\u201d`;
  const pageTitle = (
    <PageTitle title={`${BASE_TITLE} results for ${quotedQuery}`} />
  );
  let content = null;

  if (query && output) {
    const lines: string[][] = JSON.parse(output.snippetRows);
    const header = lines[0];
    const rows = lines.slice(1);
    const mightBeTruncated = rows.length === output.snippetMaxRows;
    const downloadProps = {
      href: output.csvUrl,
      download: "multi-landlord.csv",
    };

    content = (
      <>
        {pageTitle}
        <h3 {...queryFormResultFocusProps}>Query results for {quotedQuery}</h3>
        <p>
          <a {...downloadProps} className="button">
            Download CSV
          </a>
        </p>
        {mightBeTruncated ? (
          <p>
            Only the first {output.snippetMaxRows} rows are shown. Please{" "}
            <a {...downloadProps}>download the CSV</a> for the full dataset.
          </p>
        ) : (
          <p>
            {rows.length} result{rows.length > 1 && "s"} found.
          </p>
        )}
        <div style={{ maxWidth: "100%", overflowX: "scroll" }}>
          <table className="table">
            <thead>
              <tr>
                {header.map((heading, i) => (
                  <th key={i}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((column, i) => (
                    <td key={i}>{getColumnValue(header[i], column)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (query) {
    content = (
      <>
        {pageTitle}
        <h3 {...queryFormResultFocusProps}>No results for {quotedQuery}.</h3>
      </>
    );
  }

  return (
    <div className="content">
      <br />
      {content}
    </div>
  );
}

function MultiLandlordPage(props: RouteComponentProps) {
  const emptyInput = { landlords: "" };

  return (
    <Page title={BASE_TITLE} withHeading>
      <QueryFormSubmitter
        {...props}
        query={DataRequestMultiLandlordQuery}
        emptyInput={emptyInput}
        emptyOutput={null}
      >
        {(ctx, latestInput, latestOutput) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("landlords")}
              label="Landlords (comma-separated)"
            />
            <NextButton label="Request data" isLoading={ctx.isLoading} />
            {latestOutput !== undefined && (
              <SearchResults
                output={latestOutput}
                query={latestInput.landlords}
              />
            )}
          </>
        )}
      </QueryFormSubmitter>
    </Page>
  );
}

export default function DataRequestsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={JustfixRoutes.locale.dataRequests.home} exact>
        <Redirect to={JustfixRoutes.locale.dataRequests.multiLandlord} />
      </Route>
      <Route
        path={JustfixRoutes.locale.dataRequests.multiLandlord}
        exact
        component={MultiLandlordPage}
      />
    </Switch>
  );
}
