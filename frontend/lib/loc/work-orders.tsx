import React, { useState } from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { WorkOrderTicketsMutation } from "../queries/WorkOrderTicketsMutation";
import { TextualFormField, CheckboxFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { Formset } from "../forms/formset";
import { FetchMutationInfo } from "../forms/forms-graphql";
import { WithServerFormFieldErrors } from "../forms/form-errors";

// type TicketNumbers = {
//   ticketNumber: string;
// };

// type WorkorderTicketInput = {
//   ticketNumbers: TicketNumbers[];
// };

// type WorkOrderTicketOutput = WithServerFormFieldErrors & {
//   ticketNumbers: string[] | null;
// };

// export type WorkOrderTicketFormProps = {
//   mutation: FetchMutationInfo<WorkorderTicketInput, WorkOrderTicketOutput>;
// };

const MAXIMUM_TICKETS = 10;

function labelForTicketNumbers(i: number): string {
  let word: string = "Work order ticket number";
  return i > 0 ? word + ` #${i + 1}` : word;
}

function getInitialState(ticketNumbers: []) {
  return ticketNumbers.map((item) => ({ ticketNumber: item }));
}

const WorkOrdersPage = MiddleProgressStep((props) => {
  const [checked, setChecked] = useState(false);

  return (
    <Page title="Work order repairs ticket">
      <div>
        <h1 className="title is-4 is-spaced">Work order repairs ticket</h1>
        <p className="subtitle is-6">
          Enter at least one work ticket number. We’ll include these in your
          letter so management can see the issues you’ve already reported.{" "}
        </p>
        <SessionUpdatingFormSubmitter
          mutation={WorkOrderTicketsMutation}
          initialState={(session) => ({
            ticketNumbers: getInitialState(session.workOrderTickets) || [],
          })}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <>
              <Formset
                {...ctx.formsetPropsFor("ticketNumbers")}
                maxNum={MAXIMUM_TICKETS}
                emptyForm={{ ticketNumber: "" }}
              >
                {(formsetCtx, i) => (
                  <TextualFormField
                    label={labelForTicketNumbers(i)}
                    {...formsetCtx.fieldPropsFor("ticketNumber")}
                    isDisabled={checked}
                  />
                )}
              </Formset>
              <CheckboxFormField
                // when this fieldprop is passed in, the checkbox is automatically checked lol. why?
                // {...ctx.fieldPropsFor("ticketNumbers")}
                onChange={(checked) => {
                  // When this checkbox is checked, we erase the work order ticket numbers
                  if (checked) {
                    ctx.options.currentState.ticketNumbers = [];
                  }
                  setChecked(checked);
                }}
              >
                I don't have a ticket number
              </CheckboxFormField>
              {ctx.options.currentState.ticketNumbers.length ==
                MAXIMUM_TICKETS && (
                <p>
                  The maximum number of tickets you can enter is{" "}
                  {MAXIMUM_TICKETS}.
                </p>
              )}
              <ProgressButtons
                back={props.prevStep}
                isLoading={ctx.isLoading}
              />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
});

export default WorkOrdersPage;
