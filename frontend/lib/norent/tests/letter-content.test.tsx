import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  NorentLetterContent,
  noRentSampleLetterProps,
} from "../letter-content";
import { initNationalMetadataForTesting } from "../letter-builder/tests/national-metadata-test-util";
import { override } from "../../tests/util";
import {
  preloadLingui,
  PreloadedLinguiI18nProvider,
} from "../../tests/lingui-preloader";
import { NorentLinguiI18n } from "../site";

beforeAll(initNationalMetadataForTesting);
beforeAll(preloadLingui(NorentLinguiI18n));

describe("<NorentLetterContent>", () => {
  it("works", () => {
    const props = override(noRentSampleLetterProps, {
      todaysDate: "2020-04-15T15:41:37.114Z",
    });
    const pal = new ReactTestingLibraryPal(
      (
        <PreloadedLinguiI18nProvider>
          <NorentLetterContent {...props} />
        </PreloadedLinguiI18nProvider>
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});
