import React from "react";
import { SessionStepBuilder } from "../progress/session-step-builder";
import { AccessForInspectionMutation } from "../queries/AccessForInspectionMutation";
import { TextualFormField } from "../forms/form-fields";

const onboardingStepBuilder = new SessionStepBuilder(
  (sess) => sess.onboardingInfo
);

type HpType = "hp" | "ehp";

const AccessForInspectionGenerator = (type: HpType) =>
  onboardingStepBuilder.createStep(AccessForInspectionMutation, {
    title: "Access for Your HPD Inspection",
    toFormInput: (onb) => onb.finish(),
    renderIntro: () => (
      <>
        <p>
          On the day of your HPD Inspection, the Inspector will need access to
          your apartment during a window of time that you will choose with{" "}
          {type === "ehp"
            ? "your lawyer"
            : "the HP Clerk when you submit your paperwork in Court"}
          .
        </p>
      </>
    ),
    renderForm: (ctx) => (
      <>
        <TextualFormField
          {...ctx.fieldPropsFor("floorNumber")}
          type="number"
          min="0"
          label="What floor do you live on?"
        />
      </>
    ),
  });

export const AccessForInspection = AccessForInspectionGenerator("hp");
export const EhpAccessForInspection = AccessForInspectionGenerator("ehp");
