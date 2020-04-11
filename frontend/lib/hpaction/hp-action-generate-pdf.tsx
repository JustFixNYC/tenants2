import React, { useContext } from 'react';
import Page from '../ui/page';
import { HPUploadStatus, GenerateHpActionPdfInput } from '../queries/globalTypes';
import { AppContext } from '../app-context';
import { FormContextRenderer } from '../forms/form';
import { SessionUpdatingFormSubmitter } from '../forms/session-updating-form-submitter';
import { GenerateHPActionPDFMutation } from '../queries/GenerateHPActionPDFMutation';
import { NextButton } from '../ui/buttons';
import { SessionPoller } from '../networking/session-poller';
import { GetHPActionUploadStatus } from '../queries/GetHPActionUploadStatus';
import { Redirect } from 'react-router-dom';
import { HiddenFormField } from '../forms/form-fields';
import { HPActionChoice } from '../../../common-data/hp-action-choices';

type BaseGeneratePDFFormProps = {
  kind: HPActionChoice,
  toWaitForUpload: string,
};

type GeneratePDFFormProps = BaseGeneratePDFFormProps & {
  children: FormContextRenderer<GenerateHpActionPdfInput, any>,
};

export const GeneratePDFForm = ({kind, ...props}: GeneratePDFFormProps) => (
  <SessionUpdatingFormSubmitter mutation={GenerateHPActionPDFMutation}
   initialState={{kind}}
   onSuccessRedirect={props.toWaitForUpload}>
     {ctx => <>
       <HiddenFormField {...ctx.fieldPropsFor('kind')} />
       {props.children(ctx)}
     </>}
  </SessionUpdatingFormSubmitter>
);
  
const HPActionUploadError = (props: BaseGeneratePDFFormProps) => (
  <Page title="Alas." withHeading className="content">
    <p>Unfortunately, an error occurred when generating your HP Action packet.</p>
    <GeneratePDFForm {...props}>
      {(ctx) => <NextButton isLoading={ctx.isLoading} label="Try again"/>}
    </GeneratePDFForm>
  </Page>
);

const HPActionWaitForUpload = () => (
  <Page title="Please wait">
    <p className="has-text-centered">
      Please wait while your HP Action documents are generated&hellip;
    </p>
    <p className="has-text-centered">
      This could take a while, so sit tight.
    </p>
    <SessionPoller query={GetHPActionUploadStatus} />
    <section className="section" aria-hidden="true">
      <div className="jf-loading-overlay">
        <div className="jf-loader"/>
      </div>
    </section>
  </Page>
);

type ShowHPUploadStatusProps = BaseGeneratePDFFormProps & {
  toSuccess: string,
  toNotStarted: string,
};

function useGetHpaUploadStatus(kind: HPActionChoice): HPUploadStatus {
  const {session} = useContext(AppContext);

  switch (kind) {
    case "EMERGENCY":
      return session.emergencyHpActionUploadStatus;
    case "NORMAL":
      return session.hpActionUploadStatus;
  }
}

export const ShowHPUploadStatus: React.FC<ShowHPUploadStatusProps> = props => {
  let status = useGetHpaUploadStatus(props.kind);

  switch (status) {
    case HPUploadStatus.STARTED:
    return <HPActionWaitForUpload />;

    case HPUploadStatus.SUCCEEDED:
    return <Redirect to={props.toSuccess} />;

    case HPUploadStatus.ERRORED:
    return <HPActionUploadError {...props} />;

    case HPUploadStatus.NOT_STARTED:
    return <Redirect to={props.toNotStarted} />;
  }
};
