import React from "react";
import Page from "../../ui/page";
import { OutboundLink } from "../../ui/outbound-link";
import { ProgressButtons } from "../../ui/buttons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentOptInToSajeCommsMutation } from "../../queries/NorentOptInToSajeCommsMutation";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { CheckboxFormField } from "../../forms/form-fields";
import { LocalizedOutboundLink } from "../../ui/localized-outbound-link";
import { MiddleProgressStep } from "../../progress/progress-step-route";

const SAJE_WEBSITE_URL = "https://www.saje.net/";

/**
 * The default value of the SAJE checkbox; this will essentially determine if RTTC
 * communications are opt-in or opt-out.
 */
const SAJE_CHECKBOX_DEFAULT = true;

const getSajeValue = (s: AllSessionInfo) =>
  s.onboardingInfo?.canReceiveSajeComms ??
  s.norentScaffolding?.canReceiveSajeComms;

export function hasUserSeenSajeCheckboxYet(s: AllSessionInfo): boolean {
  return typeof getSajeValue(s) === "boolean" ? true : false;
}

export const NorentLbLosAngelesKyr = MiddleProgressStep((props) => {
  return (
    <Page title={li18n._(t`Los Angeles County`)}>
      <h2 className="title">
        <Trans>
          Looks like you're in{" "}
          <span className="has-text-info">Los Angeles County, California</span>
        </Trans>
      </h2>
      <div className="content">
        <p>
          <Trans id="norent.losAngelesKyrAB832">
            We’ve worked with the non-profit organization{" "}
            <OutboundLink
              href={SAJE_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              SAJE
            </OutboundLink>{" "}
            to provide additional support once you’ve sent your letter. You can
            learn more about how AB832 affects Los Angeles residents at{" "}
            <LocalizedOutboundLink
              hrefs={{
                en: "https://www.stayhousedla.org/tenant_rights/",
                es: "https://www.stayhousedla.org/es/tenant_rights/",
              }}
            >
              Stay Housed LA
            </LocalizedOutboundLink>
            .
          </Trans>
        </p>
        <SessionUpdatingFormSubmitter
          mutation={NorentOptInToSajeCommsMutation}
          initialState={(s) => ({
            optIn: getSajeValue(s) ?? SAJE_CHECKBOX_DEFAULT,
          })}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => {
            return (
              <>
                <CheckboxFormField {...ctx.fieldPropsFor("optIn")}>
                  <Trans>
                    Strategic Actions for a Just Economy (SAJE) can contact me
                    to provide additional support.
                  </Trans>
                </CheckboxFormField>
                <ProgressButtons
                  back={props.prevStep}
                  isLoading={ctx.isLoading}
                />
              </>
            );
          }}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
});
