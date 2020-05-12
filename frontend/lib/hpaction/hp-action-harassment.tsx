import React from "react";

import { SessionStepBuilder } from "../progress/session-step-builder";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_TRUE,
} from "../forms/yes-no-radios-form-field";
import {
  HarassmentApartmentMutation,
  HarassmentApartmentMutation_output,
} from "../queries/HarassmentApartmentMutation";
import {
  HarassmentExplainMutation,
  HarassmentExplainMutation_output,
} from "../queries/HarassmentExplainMutation";
import { CheckboxFormField } from "../forms/form-fields";
import {
  HarassmentAllegations1Mutation,
  HarassmentAllegations1Mutation_output,
} from "../queries/HarassmentAllegations1Mutation";
import {
  HarassmentAllegations2Mutation,
  HarassmentAllegations2Mutation_output,
} from "../queries/HarassmentAllegations2Mutation";
import { HARASSMENT_DETAILS_MAX_LENGTH } from "../../../common-data/hp-action.json";
import { TextareaWithCharsRemaining } from "../forms/chars-remaining";
import {
  hideByDefault,
  ConditionalYesNoRadiosFormField,
} from "../forms/conditional-form-fields";
import {
  HarassmentApartmentInput,
  HarassmentAllegations1Input,
  HarassmentAllegations2Input,
  HarassmentExplainInput,
} from "../queries/globalTypes";

const stepBuilder = new SessionStepBuilder((sess) => sess.harassmentDetails);

export const HarassmentApartment = stepBuilder.createStep<
  HarassmentApartmentInput,
  HarassmentApartmentMutation_output
>((props) => ({
  title: "Your building",
  mutation: HarassmentApartmentMutation,
  toFormInput: (h) =>
    h
      .yesNoRadios(
        "moreThanOneFamilyPerApartment",
        "twoOrLessApartmentsInBuilding"
      )
      .finish(),
  renderIntro: () => (
    <>
      To sue your landlord for harassment, we need to know a few details about
      your building.
    </>
  ),
  renderForm: (ctx) => {
    const twoOrLessApts = ctx.fieldPropsFor("twoOrLessApartmentsInBuilding");
    const moreThanOneFam = hideByDefault(
      ctx.fieldPropsFor("moreThanOneFamilyPerApartment")
    );

    if (twoOrLessApts.value === YES_NO_RADIOS_TRUE) {
      moreThanOneFam.hidden = false;
    }

    return (
      <>
        <YesNoRadiosFormField
          {...twoOrLessApts}
          // We are "flipping" this question to make it easier to read.
          label="Does your building have more than 2 apartments?"
          flipLabels
        />
        <ConditionalYesNoRadiosFormField
          {...moreThanOneFam}
          label="Is there more than one family living in each apartment?"
        />
      </>
    );
  },
}));

const TOTAL_ALLEGATIONS_PAGES = 2;

const allegationsTitle = (page: number) =>
  `Harassment allegations (page ${page} of ${TOTAL_ALLEGATIONS_PAGES})`;

const renderAllegationsIntro = () => (
  <>
    <p>Choose any of the following that have happened.</p>
  </>
);

const AllegationsFieldset = (props: { children: any }) => (
  <fieldset>
    <legend>
      The landlord, or someone acting on the landlord's behalf has:
    </legend>
    {props.children}
  </fieldset>
);

export const HarassmentAllegations1 = stepBuilder.createStep<
  HarassmentAllegations1Input,
  HarassmentAllegations1Mutation_output
>((props) => ({
  title: allegationsTitle(1),
  mutation: HarassmentAllegations1Mutation,
  toFormInput: (h) => h.finish(),
  renderIntro: renderAllegationsIntro,
  renderForm: (ctx) => (
    <AllegationsFieldset>
      <CheckboxFormField {...ctx.fieldPropsFor("allegForce")}>
        used force or threatened to use force
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegMisleadingInfo")}>
        lied about the occupancy or rent status of your apartment
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegStoppedService")}>
        interrupted or stopped essential services repeatedly
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegFailedToComply")}>
        has not made required repairs even though HPD has already filed
        violations{" "}
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegFalseCertRepairs")}>
        lied about making required repairs
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegConductInViolation")}>
        done construction without a permit from the Department of Buildings
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegSued")}>
        brought court cases for no good reason.
      </CheckboxFormField>
    </AllegationsFieldset>
  ),
}));

export const HarassmentAllegations2 = stepBuilder.createStep<
  HarassmentAllegations2Input,
  HarassmentAllegations2Mutation_output
>((props) => ({
  title: allegationsTitle(2),
  mutation: HarassmentAllegations2Mutation,
  toFormInput: (h) => h.finish(),
  renderIntro: renderAllegationsIntro,
  renderForm: (ctx) => (
    <AllegationsFieldset>
      <CheckboxFormField {...ctx.fieldPropsFor("allegRemovedPossessions")}>
        removed your belongings, the front door, or locked you out of your
        apartment
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegInducedLeaving")}>
        made buyout offers while threatening you <strong>or</strong> cursed or
        used profane language to intimidate you <strong>or</strong> knowingly
        lied to you <strong>or</strong> contacted your job without your
        permission
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegContact")}>
        repeatedly contacted or visited you outside of business hours
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegThreatsReStatus")}>
        threatened you based on your age; race; creed; color; national origin;
        gender; disability; marital or partnership status; caregiver status;
        uniformed service; sexual orientation; citizenship status; status as a
        victim of domestic violence, sex offenses, or stalking; lawful source of
        income; or because you have children
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegRequestedId")}>
        asked for documents that would reveal citizenship status when they
        already have your government-issued ID
      </CheckboxFormField>
      <CheckboxFormField {...ctx.fieldPropsFor("allegDisturbed")}>
        repeatedly disturbed your comfort, peace, or quiet <strong>or</strong>{" "}
        made it such that you had to get or stop medical treatment
      </CheckboxFormField>
    </AllegationsFieldset>
  ),
}));

export const HarassmentExplain = stepBuilder.createStep<
  HarassmentExplainInput,
  HarassmentExplainMutation_output
>((props) => ({
  title: "Harassment explanation",
  mutation: HarassmentExplainMutation,
  toFormInput: (h) => h.finish(),
  renderForm: (ctx) => (
    <>
      <TextareaWithCharsRemaining
        {...ctx.fieldPropsFor("harassmentDetails")}
        maxLength={HARASSMENT_DETAILS_MAX_LENGTH}
        label="Explain how the landlord or someone on the landlord's behalf has harassed you. Be as specific as you can and be sure to give the date these things happened. (If you cannot remember the exact date, give the month and year.)"
      />
    </>
  ),
}));
