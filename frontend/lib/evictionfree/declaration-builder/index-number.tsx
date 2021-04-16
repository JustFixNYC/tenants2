import { t, Trans } from "@lingui/macro";
import React from "react";
import {
  ConditionalFormField,
  hideByDefault,
} from "../../forms/conditional-form-fields";
import { TextualFormField } from "../../forms/form-fields";
import { optionalizeLabel } from "../../forms/optionalize-label";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_FALSE,
  YES_NO_RADIOS_TRUE,
} from "../../forms/yes-no-radios-form-field";
import { li18n } from "../../i18n-lingui";
import { EvictionFreeIndexNumberV2Mutation } from "../../queries/EvictionFreeIndexNumberV2Mutation";
import { Accordion } from "../../ui/accordion";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";
import { StaticImage } from "../../ui/static-image";
import { getEFImageSrc } from "../homepage";
import { EvictionFreeNotSentDeclarationStep } from "./step-decorators";

export const EvictionFreeIndexNumber = EvictionFreeNotSentDeclarationStep(
  (props) => {
    return (
      <Page
        title={li18n._(t`Do you have a current eviction court case?`)}
        withHeading="big"
        className="content"
      >
        <SessionUpdatingFormSubmitter
          mutation={EvictionFreeIndexNumberV2Mutation}
          initialState={(s) => ({
            hasCurrentCase: s.hardshipDeclarationDetails?.indexNumber
              ? YES_NO_RADIOS_TRUE
              : YES_NO_RADIOS_FALSE,
            indexNumber: s.hardshipDeclarationDetails?.indexNumber || "",
            courtName: s.hardshipDeclarationDetails?.courtName || "",
          })}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => {
            const yesNoProps = ctx.fieldPropsFor("hasCurrentCase");
            const indexNumberProps = hideByDefault(
              ctx.fieldPropsFor("indexNumber")
            );
            const courtNameProps = hideByDefault(
              ctx.fieldPropsFor("courtName")
            );

            if (yesNoProps.value === YES_NO_RADIOS_TRUE) {
              indexNumberProps.hidden = false;
              courtNameProps.hidden = false;
            }

            return (
              <>
                <YesNoRadiosFormField {...yesNoProps} label="" />
                <ConditionalFormField {...indexNumberProps}>
                  <>
                    <p>
                      <Trans>
                        We'll need to add your case's index number to your
                        declaration.
                      </Trans>
                    </p>
                    <TextualFormField
                      {...indexNumberProps}
                      label={li18n._(t`Your case's index number`)}
                    />
                    <Accordion
                      question={li18n._(
                        t`Where do I find my case's index number?`
                      )}
                    >
                      <Trans>
                        Your index number can be found at the top of Postcard or
                        Notice of Petition that you received from housing court.{" "}
                        <span aria-hidden="true">They look like this:</span>
                      </Trans>
                      <StaticImage
                        ratio="is-3by1"
                        src={getEFImageSrc("postcard", "png")}
                        alt=""
                      />
                      <StaticImage
                        ratio="is-3by1"
                        src={getEFImageSrc("petition", "png")}
                        alt=""
                      />
                    </Accordion>
                  </>
                </ConditionalFormField>
                <ConditionalFormField {...courtNameProps}>
                  <>
                    <p>
                      <Trans>
                        If you know the court name your case is associated with,
                        please provide it below. Otherwise, leave this blank.
                      </Trans>
                    </p>
                    <TextualFormField
                      {...courtNameProps}
                      label={optionalizeLabel(
                        li18n._(t`Your case's court name`)
                      )}
                    />
                  </>
                </ConditionalFormField>
                <ProgressButtons
                  isLoading={ctx.isLoading}
                  back={props.prevStep}
                />
              </>
            );
          }}
        </SessionUpdatingFormSubmitter>
      </Page>
    );
  }
);
