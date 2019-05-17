import React from 'react';

import { FeeWaiverInput } from "../../queries/globalTypes";
import Page from "../../page";
import { SessionUpdatingFormSubmitter } from '../../forms';
import { FeeWaiverMutation } from '../../queries/FeeWaiverMutation';
import Routes from '../../routes';
import { RadiosFormField, TextualFormField } from '../../form-fields';
import { toDjangoChoices } from '../../common-data';
import { IncomeFrequencyChoices, getIncomeFrequencyChoiceLabels } from '../../../../common-data/income-frequency-choices';
import { BackButton, NextButton } from '../../buttons';
import { AllSessionInfo } from '../../queries/AllSessionInfo';

const INITIAL_FEE_WAIVER_STATE: FeeWaiverInput = {
  incomeFrequency: '',
  incomeAmount: '',
};

function getInitialState({ feeWaiver }: AllSessionInfo): FeeWaiverInput {
  return feeWaiver ? {
    ...feeWaiver,
    incomeAmount: feeWaiver.incomeAmount.toString()
  } : INITIAL_FEE_WAIVER_STATE;
}

export const FeeWaiver = () => (
  <Page title="It's fee waiver time!" className="content">
    <h1 className="title is-4">It's fee waiver time!</h1>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverMutation}
      initialState={getInitialState}
      onSuccessRedirect={Routes.locale.hp.yourLandlord}
    >
      {(ctx) => <>
        <RadiosFormField
          label="How often do you get paid?"
          choices={toDjangoChoices(
            IncomeFrequencyChoices,
            getIncomeFrequencyChoiceLabels()
          )}
          {...ctx.fieldPropsFor('incomeFrequency')}
        />
        <TextualFormField
          label="How much do you get paid?"
          {...ctx.fieldPropsFor('incomeAmount')}
        />
        <div className="buttons jf-two-buttons">
          <BackButton to={Routes.locale.hp.issues.home} label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);
