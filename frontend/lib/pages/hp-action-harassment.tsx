import React from 'react';

import { SessionStepBuilder } from "../session-step-builder";
import { YesNoRadiosFormField } from '../yes-no-radios-form-field';
import { HarassmentApartmentMutation } from '../queries/HarassmentApartmentMutation';
import { HarassmentExplainMutation } from '../queries/HarassmentExplainMutation';
import { TextareaFormField, CheckboxFormField } from '../form-fields';
import { HarassmentCaseHistoryMutation } from '../queries/HarassmentCaseHistoryMutation';
import { HarassmentAllegations1Mutation } from '../queries/HarassmentAllegations1Mutation';
import { HarassmentAllegations2Mutation } from '../queries/HarassmentAllegations2Mutation';

const stepBuilder = new SessionStepBuilder(sess => sess.harassmentDetails);

export const HarassmentApartment = stepBuilder.createStep(props => ({
  title: "Your apartment",
  mutation: HarassmentApartmentMutation,
  toFormInput: h => h.yesNoRadios(
    'moreThanOneFamilyPerApartment', 'moreThanTwoApartmentsInBuilding').finish(),
  renderIntro: () => <>
    To sue your landlord for harassment, we need to know a few details about your apartment.
  </>,
  renderForm: ctx => <>
    <YesNoRadiosFormField {...ctx.fieldPropsFor('moreThanTwoApartmentsInBuilding')}
      label="Are there more than 2 apartments in your building?" />
    <YesNoRadiosFormField {...ctx.fieldPropsFor('moreThanOneFamilyPerApartment')}
      label="Is there more than one family living in each apartment?" />
  </>
}));

const TOTAL_ALLEGATIONS_PAGES = 2;

const allegationsTitle = (page: number) =>
  `"Harassment allegations (page ${page} of ${TOTAL_ALLEGATIONS_PAGES})"`;

const renderAllegationsIntro = () => <>
  <p>Choose any of the following that have happened.</p>
</>;

const AllegationsFieldset = (props: { children: any }) => (
  <fieldset>
    <legend>The landlord, or someone acting on the landlord's behalf has:</legend>
    {props.children}
  </fieldset>
);

export const HarassmentAllegations1 = stepBuilder.createStep(props => ({
  title: allegationsTitle(1),
  mutation: HarassmentAllegations1Mutation,
  toFormInput: h => h.finish(),
  renderIntro: renderAllegationsIntro,
  renderForm: ctx => <AllegationsFieldset>
    <CheckboxFormField {...ctx.fieldPropsFor('allegForce')}>
      used force or said they would use force or implied the use of force
    </CheckboxFormField>
  </AllegationsFieldset>
}));

export const HarassmentAllegations2 = stepBuilder.createStep(props => ({
  title: allegationsTitle(2),
  mutation: HarassmentAllegations2Mutation,
  toFormInput: h => h.finish(),
  renderIntro: renderAllegationsIntro,
  renderForm: ctx => <AllegationsFieldset>
    <CheckboxFormField {...ctx.fieldPropsFor('allegRemovedPossessions')}>
      removed tenant possessions from the unit, or removed the unit front door or made the lock to the unit not work, or changed the lock on the unit door without giving a key to the new lock to the tenant/petitioner
    </CheckboxFormField>
  </AllegationsFieldset>
}));

export const HarassmentExplain = stepBuilder.createStep(props => ({
  title: "Harassment explanation",
  mutation: HarassmentExplainMutation,
  toFormInput: h => h.finish(),
  renderForm: ctx => <>
    <TextareaFormField {...ctx.fieldPropsFor('harassmentDetails')}
      label="Explain how the landlord or someone on the landlord's behalf has harassed you. Be as specific as you can and be sure to give the date these things happened. (If you cannot remember the exact date, give the month and year.)" />
  </>
}));

export const HarassmentCaseHistory = stepBuilder.createStep(props => ({
  title: "Harassment case history (optional)",
  mutation: HarassmentCaseHistoryMutation,
  toFormInput: h => h.finish(),
  renderIntro: () => <>
    <p>Have you brought a case in housing court against this landlord for harassment before this case?</p>
    <p>If not, you may skip this question.</p>
  </>,
  renderForm: ctx => <>
    <TextareaFormField {...ctx.fieldPropsFor('priorReliefSoughtCaseNumbersAndDates')}
      label="Please provide the court case number (the “index number”) and/or the date(s) of the earlier case(s). Please also include the case number and date(s) of any case(s) you may have brought in the housing court for repairs." />
  </>
}));
