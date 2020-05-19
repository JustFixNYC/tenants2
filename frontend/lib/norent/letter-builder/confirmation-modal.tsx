import React from "react";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";

type NorentConfirmationModalProps = {
  nextStep: string;
  children: React.ReactNode;
  title: string;
};

/**
 * A modal to use when our verification of the user's latest form input
 * differs from their input: for example, if we think an address is
 * undeliverable, or if we think that something the user wrote may
 * be mis-spelled.
 *
 * This modal is expected to be at a route that is one directory level
 * deeper than the page it's overlaid atop. For instance, if the page
 * it's on is at `/foo/bar`, then the modal itself can be at
 * `/foo/bar/confirmation-modal`.
 */
export const NorentConfirmationModal: React.FC<NorentConfirmationModalProps> = (
  props
) => {
  return (
    <Modal
      title={props.title}
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          {props.children}
          <ProgressButtonsAsLinks
            back={ctx.getLinkCloseProps().to}
            backLabel={li18n._(t`No`)}
            next={props.nextStep}
            nextLabel={li18n._(t`Yes`)}
          />
        </>
      )}
    />
  );
};
