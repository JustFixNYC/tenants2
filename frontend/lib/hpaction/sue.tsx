import React from "react";

import { SessionStepBuilder } from "../progress/session-step-builder";
import { HpActionSueMutation } from "../queries/HpActionSueMutation";
import { CheckboxFormField } from "../forms/form-fields";

const hpActionDetailsStepBuilder = new SessionStepBuilder(
  (sess) => sess.hpActionDetails
);

export const HpActionSue = hpActionDetailsStepBuilder.createStep({
  title: "What would you like to do? (Select all that apply)",
  mutation: HpActionSueMutation,
  toFormInput: (hp) =>
    hp.nullsToBools(false, "sueForRepairs", "sueForHarassment").finish(),
  renderForm: (ctx) => (
    <>
      <CheckboxFormField {...ctx.fieldPropsFor("sueForRepairs")}>
        Sue my landlord for repairs
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("sueForHarassment")}>
        Sue my landlord for harassment
      </CheckboxFormField>
    </>
  ),
});
