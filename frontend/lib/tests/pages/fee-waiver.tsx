import React from 'react';

import { FeeWaiverInput } from "../../queries/globalTypes";
import Page from "../../page";
import { SessionUpdatingFormSubmitter } from '../../forms';
import { FeeWaiverMutation } from '../../queries/FeeWaiverMutation';
import { exactSubsetOrDefault } from '../../util';
import Routes from '../../routes';
import { RadiosFormField } from '../../form-fields';
import { toDjangoChoices } from '../../common-data';
import { IncomeFrequencyChoices, getIncomeFrequencyChoiceLabels } from '../../../../common-data/income-frequency-choices';
import { BackButton, NextButton } from '../../buttons';

const INITIAL_FEE_WAIVER_STATE: FeeWaiverInput = {
  incomeFrequency: ''
};

export const FeeWaiver = () => (
  <Page title="It's fee waiver time!" className="content">
    <h1 className="title is-4">It's fee waiver time!</h1>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverMutation}
      initialState={(session) => exactSubsetOrDefault(session.feeWaiver, INITIAL_FEE_WAIVER_STATE)}
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
        <div className="buttons jf-two-buttons">
          <BackButton to={Routes.locale.hp.issues.home} label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);
