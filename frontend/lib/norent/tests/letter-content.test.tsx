import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
} from "../letter-content";
import { initNationalMetadataForTesting } from "../letter-builder/tests/national-metadata-test-util";
import { override } from "../../tests/util";
import { NorentI18nProviderForTests } from "./i18n-provider-for-tests";

beforeAll(initNationalMetadataForTesting);

describe("<NorentLetterContent>", () => {
  it("works", () => {
    const props = override(noRentSampleLetterProps, {
      todaysDate: "2020-04-15T15:41:37.114Z",
    });
    const pal = new ReactTestingLibraryPal(
      (
        <NorentI18nProviderForTests>
          <NorentLetterContent {...props} />
        </NorentI18nProviderForTests>
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});
