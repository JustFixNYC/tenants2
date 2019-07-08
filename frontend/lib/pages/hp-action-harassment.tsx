import React from 'react';

import { SessionStepBuilder } from "../session-step-builder";
import { YesNoRadiosFormField } from '../yes-no-radios-form-field';
import { HarassmentApartmentMutation } from '../queries/HarassmentApartmentMutation';
import { HarassmentExplainMutation } from '../queries/HarassmentExplainMutation';
import { CheckboxFormField } from '../form-fields';
import { HarassmentCaseHistoryMutation } from '../queries/HarassmentCaseHistoryMutation';
import { HarassmentAllegations1Mutation } from '../queries/HarassmentAllegations1Mutation';
import { HarassmentAllegations2Mutation } from '../queries/HarassmentAllegations2Mutation';
import { HARASSMENT_DETAILS_MAX_LENGTH, PRIOR_RELIEF_MAX_LENGTH } from '../../../common-data/hp-action.json';
import { TextareaWithCharsRemaining } from '../chars-remaining';

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
  `Harassment allegations (page ${page} of ${TOTAL_ALLEGATIONS_PAGES})`;

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
      used force or threatened to use force
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegMisleadingInfo')}>
      lied about occupancy or rent status of your apartment
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegStoppedService')}>
      interrupted or stopped essential services repeatedly
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegFailedToComply')}>
      has not made required repairs even though HPD has already filed violations     </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegFalseCertRepairs')}>
      lied about making required repairs
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegConductInViolation')}>
      done construction without a permit from the Department of Buildings
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegSued')}>
      brought court cases for no good reason.
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
    <CheckboxFormField {...ctx.fieldPropsFor('allegInducedLeaving')}>
      offered money or valuables to tenant, or their relatives, to induce tenant to leave, or to surrender or waive their rights, without written disclosure of the tenant’s rights and without written permission to make an offer from court or the tenant; or, while: threatening, intimidating or using obscene language; frequently harassing or communicating abusively; communicating at tenant’s place of employment without prior written consent; or  knowingly falsifying or misrepresenting information to tenant
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegContact')}>
      repeatedly contacted or visited tenant without written consent on: weekends, legal holidays, outside of 9am-5pm, or in such a manner that would abuse or harass tenant
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegThreatsReStatus')}>
      threatened tenant based on their age; race; creed; color; national origin; gender; disability; marital or partnership status; caregiver status; uniformed service; sexual orientation; citizenship status; status as a victim of domestic violence, sex offenses, or stalking; lawful source of income; or because they have children as terms are defined in NYC Admin. Codes §8–102 and §8–107.1
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegRequestedId')}>
      requested identifying documentation that would disclose tenant’s citizenship status, when they have already provided government-issued personal identification as such term is defined in NYC Admin. Code §21–908, and when the documentation was neither required by law, nor requested for any unrelated, specific, and limited purpose
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('allegDisturbed')}>
      repeatedly caused or permitted acts or omissions that substantially interfered with or disturbed the comfort, peace, or quiet of the tenant, including requiring them to seek, receive, or refrain from medical treatment in violation of NYC Admin. Code §26–1202[b].  If the acts or omissions involve physical conditions in the unit or the building, a violation of record was issued.
    </CheckboxFormField>
  </AllegationsFieldset>
}));

export const HarassmentExplain = stepBuilder.createStep(props => ({
  title: "Harassment explanation",
  mutation: HarassmentExplainMutation,
  toFormInput: h => h.finish(),
  renderForm: ctx => <>
    <TextareaWithCharsRemaining {...ctx.fieldPropsFor('harassmentDetails')}
      maxLength={HARASSMENT_DETAILS_MAX_LENGTH}
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
    <TextareaWithCharsRemaining {...ctx.fieldPropsFor('priorReliefSoughtCaseNumbersAndDates')}
      maxLength={PRIOR_RELIEF_MAX_LENGTH}
      label="Please provide the court case number (the “index number”) and/or the date(s) of the earlier case(s). Please also include the case number and date(s) of any case(s) you may have brought in the housing court for repairs." />
  </>
}));
