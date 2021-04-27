import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { YesNoConfirmationModal } from "../confirmation-modal";

describe("ConfirmationModal", () => {
  it("should work", () => {
    const pal = new AppTesterPal(
      (
        <YesNoConfirmationModal title="Confirm this!" nextStep="/blah">
          <p>Are you sure you want to bust forth?</p>
        </YesNoConfirmationModal>
      ),
      { url: "/foo/confirm-modal" }
    );
    pal.rr.getByText("Confirm this!");
    pal.rr.getByText("Are you sure you want to bust forth?");
    expect(pal.rr.getByText("No").getAttribute("href")).toBe("/foo");
    expect(pal.rr.getByText("Yes").getAttribute("href")).toBe("/blah");
  });
});
