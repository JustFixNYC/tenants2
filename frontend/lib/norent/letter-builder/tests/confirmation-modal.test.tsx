import React from "react";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import { NorentConfirmationModal } from "../confirmation-modal";

describe("ConfirmationModal", () => {
  it("should work", () => {
    const pal = new AppTesterPal(
      (
        <NorentConfirmationModal title="Confirm this!" nextStep="/blah">
          <p>Are you sure you want to bust forth?</p>
        </NorentConfirmationModal>
      ),
      { url: "/foo/confirm-modal" }
    );
    pal.rr.getByText("Confirm this!");
    pal.rr.getByText("Are you sure you want to bust forth?");
    expect(pal.rr.getByText("No").getAttribute("href")).toBe("/foo");
    expect(pal.rr.getByText("Yes").getAttribute("href")).toBe("/blah");
  });
});
