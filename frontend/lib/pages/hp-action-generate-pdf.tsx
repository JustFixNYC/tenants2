import React, { useContext } from 'react';
import Page from '../page';
import { HPUploadStatus } from '../queries/globalTypes';
import { AppContext } from '../app-context';
import { FormContextRenderer } from '../form';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import { GenerateHPActionPDFMutation } from '../queries/GenerateHPActionPDFMutation';
import { NextButton } from '../buttons';
import { SessionPoller } from '../session-poller';
import { GetHPActionUploadStatus } from '../queries/GetHPActionUploadStatus';
import { Redirect } from 'react-router-dom';

type GeneratePDFFormProps = {
  children: FormContextRenderer<{}, any>,
  toWaitForUpload: string,
};

export const GeneratePDFForm = (props: GeneratePDFFormProps) => (
  <SessionUpdatingFormSubmitter mutation={GenerateHPActionPDFMutation} initialState={{}}
   onSuccessRedirect={props.toWaitForUpload} {...props} />
);
  
const HPActionUploadError = (props: {toWaitForUpload: string}) => (
  <Page title="Alas." withHeading className="content">
    <p>Unfortunately, an error occurred when generating your HP Action packet.</p>
    <GeneratePDFForm toWaitForUpload={props.toWaitForUpload}>
      {(ctx) => <NextButton isLoading={ctx.isLoading} label="Try again"/>}
    </GeneratePDFForm>
  </Page>
);
  
const HPActionWaitForUpload = () => (
  <Page title="Please wait">
    <p className="has-text-centered">
      Please wait while your HP action documents are generated&hellip;
    </p>
    <SessionPoller query={GetHPActionUploadStatus} />
    <section className="section" aria-hidden="true">
      <div className="jf-loading-overlay">
        <div className="jf-loader"/>
      </div>
    </section>
  </Page>
);

type ShowHPUploadStatusProps = {
  toWaitForUpload: string,
  toSuccess: string,
  toNotStarted: string,
};

export const ShowHPUploadStatus: React.FC<ShowHPUploadStatusProps> = props => {
  const {session} = useContext(AppContext);
  let status = session.hpActionUploadStatus;

  switch (status) {
    case HPUploadStatus.STARTED:
    return <HPActionWaitForUpload />;

    case HPUploadStatus.SUCCEEDED:
    return <Redirect to={props.toSuccess} />;

    case HPUploadStatus.ERRORED:
    return <HPActionUploadError toWaitForUpload={props.toWaitForUpload} />;

    case HPUploadStatus.NOT_STARTED:
    return <Redirect to={props.toNotStarted} />;
  }
};
