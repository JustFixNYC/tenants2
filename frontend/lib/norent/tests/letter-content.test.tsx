import React from "react";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  chunkifyPropsForBizarreCaliforniaLawyers,
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

describe("", () => {
  it("does nothing for non-CA letters", () => {
    const props = {
      state: "NJ",
      paymentDates: ["2020-08-01", "2020-09-01"],
    };
    expect(chunkifyPropsForBizarreCaliforniaLawyers(props)).toEqual([props]);
  });

  it("works for CA letters with months before september", () => {
    expect(
      chunkifyPropsForBizarreCaliforniaLawyers({
        state: "CA",
        paymentDates: ["2020-07-01", "2020-08-01"],
      })
    ).toEqual([{ state: "CA", paymentDates: ["2020-07-01", "2020-08-01"] }]);
  });

  it("works for CA letters with months >= september", () => {
    expect(
      chunkifyPropsForBizarreCaliforniaLawyers({
        state: "CA",
        paymentDates: ["2020-09-01", "2020-10-01"],
      })
    ).toEqual([
      { state: "CA", paymentDates: ["2020-09-01"] },
      { state: "CA", paymentDates: ["2020-10-01"] },
    ]);
  });

  it("works for CA letters with months before and >= september", () => {
    expect(
      chunkifyPropsForBizarreCaliforniaLawyers({
        state: "CA",
        paymentDates: ["2020-07-01", "2020-08-01", "2020-09-01", "2020-10-01"],
      })
    ).toEqual([
      { state: "CA", paymentDates: ["2020-07-01", "2020-08-01"] },
      { state: "CA", paymentDates: ["2020-09-01"] },
      { state: "CA", paymentDates: ["2020-10-01"] },
    ]);
  });
});

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
