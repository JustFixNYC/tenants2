import React from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { WorkOrderTicketsMutation } from "../queries/WorkOrderTicketsMutation";
import { TextualFormField, CheckboxFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { Formset } from "../forms/formset";
import { WorkOrderTicketsInput } from "../queries/globalTypes";

const MAX_TICKETS: number = 10;

function ticketNumberLabel(i: number): string {
  let label: string = "Work order ticket number";
  return i > 0 ? label + ` #${i + 1}` : label;
}

function getInitialState(
  ticketNumbers: string[],
  hasSeenWorkOrderPage: boolean | null
): WorkOrderTicketsInput {
  return {
    ticketNumbers: ticketNumbers?.map((item) => ({ ticketNumber: item })) ?? [],
    noTicket: hasSeenWorkOrderPage ? ticketNumbers?.length == 0 : false,
  };
}

const WorkOrdersPage = MiddleProgressStep((props) => {
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
          initialState={(session) =>
            getInitialState(
              session.workOrderTickets,
              session.hasSeenWorkOrderPage
            )
          }
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <>
              <Formset
                {...ctx.formsetPropsFor("ticketNumbers")}
                maxNum={MAX_TICKETS}
                emptyForm={{ ticketNumber: "" }}
              >
                {(formsetCtx, i) => (
                  <TextualFormField
                    label={ticketNumberLabel(i)}
                    {...formsetCtx.fieldPropsFor("ticketNumber")}
                    isDisabled={ctx.options.currentState.noTicket}
                  />
                )}
              </Formset>
              {ctx.options.currentState.ticketNumbers.length == MAX_TICKETS && (
                <p>
                  The maximum number of tickets you can enter is {MAX_TICKETS}.
                </p>
              )}
              <CheckboxFormField
                {...ctx.fieldPropsFor("noTicket")}
                onChange={(value) => {
                  ctx.options.setField("noTicket", value);
                  ctx.options.setField("ticketNumbers", []);
                }}
              >
                I don't have a ticket number
              </CheckboxFormField>
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
