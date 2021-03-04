import React from "react";
import { BackOrUpOneDirLevel, Modal } from "./modal";
import { Link } from "react-router-dom";
import {
  isBoroughChoice,
  getBoroughChoiceLabels,
} from "../../../common-data/borough-choices";
import { CenteredButtons } from "./centered-buttons";

export type AddressAndBorough = {
  /** A NYC street name and number, e.g. "150 court st". */
  address: string;
  /** A NYC borough choice, e.g. "STATEN_ISLAND". */
  borough: string;
};

export type ConfirmAddressModalProps = AddressAndBorough & {
  /**
   * The route to the next step of the user flow, if the user confirms the
   * correctness of the address.
   */
  nextStep: string;
};

/**
 * A modal that we present the user if the address they entered is different from
 * the one we geocoded on the server. They are given the option to go back to the
 * previous step (to change their address) or to continue to the next step.
 */
export function ConfirmAddressModal(
  props: ConfirmAddressModalProps
): JSX.Element {
  let borough = "";

  if (isBoroughChoice(props.borough)) {
    borough = getBoroughChoiceLabels()[props.borough];
  }

  return (
    <Modal
      title="Is this your address?"
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <p>
            {props.address}, {borough}
          </p>
          <CenteredButtons>
            <Link to={props.nextStep} className="button is-primary is-medium">
              Yes!
            </Link>
            <Link {...ctx.getLinkCloseProps()} className="button is-text">
              No, go back.
            </Link>
          </CenteredButtons>
        </>
      )}
    />
  );
}

export type RedirectToAddressConfirmationOrNextStepOptions = {
  /** The address the user input. */
  input: AddressAndBorough;
  /** The resolved address the server geocoded, based on the user's input. */
  resolved: AddressAndBorough;
  /** The route to go to if the user needs to confirm the correctness of the address. */
  confirmation: string;
  /**
   * The route to go to if the user doesn't need to confirm the correctness of the address
   * (i.e., if the resolved address is semantically equivalent to the input address).
   */
  nextStep: string;
};

/**
 * Given the user's input address and the resolved address that the server geocoded, either
 * present the user with a confirmation modal or send them on to the next step in their flow.
 *
 * Returns the route to redirect the user to.
 */
export function redirectToAddressConfirmationOrNextStep(
  options: RedirectToAddressConfirmationOrNextStepOptions
): string {
  const { input, resolved } = options;
  if (
    areAddressesTheSame(resolved.address, input.address) &&
    resolved.borough === input.borough
  ) {
    return options.nextStep;
  }
  return options.confirmation;
}

/** Returns whether the given street name and numbers are semantically equivalent. */
export function areAddressesTheSame(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}
