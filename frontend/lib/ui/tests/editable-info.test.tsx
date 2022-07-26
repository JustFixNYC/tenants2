import React from "react";
import { Link, MemoryRouter } from "react-router-dom";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { EditableInfo } from "../editable-info";

describe("EditableInfo", () => {
  it("works", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <MemoryRouter>
          <EditableInfo
            path="/foo/edit-thing"
            name="Thing"
            readonlyContent="read-only thing"
          >
            editable thing
            <Link to="/foo">Cancel</Link>
          </EditableInfo>
        </MemoryRouter>
      )
    );
    pal.rr.getByDisplayValue("read-only thing");
    const editBtn = pal.rr.getByLabelText("Edit Thing");
    editBtn.click();
    pal.rr.getByText("editable thing");
    const cancelBtn = pal.rr.getByText("Cancel");
    cancelBtn.click();
    pal.rr.getByDisplayValue("read-only thing");
  });
});
