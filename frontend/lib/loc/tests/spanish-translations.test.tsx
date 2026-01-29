import React from "react";
import i18n from "../../i18n";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import {
  preloadLingui,
  PreloadedLinguiI18nProvider,
} from "../../tests/lingui-preloader";
import { LocLinguiI18n } from "../routes";
import { LocContent, locSampleProps } from "../letter-content";
import { waitFor } from "@testing-library/react";
import LetterOfComplaintRoutes from "../routes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import JustfixRoutes from "../../justfix-route-info";
import { newSb } from "../../tests/session-builder";

beforeAll(preloadLingui(LocLinguiI18n));

describe("LOC Spanish translations", () => {
  afterEach(() => {
    // Reset to English after each test
    i18n.initialize("en");
  });

  describe("Welcome page", () => {
    it("renders in English", async () => {
      i18n.initialize("en");
      const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
        url: JustfixRoutes.locale.loc.welcome,
        session: newSb().withLoggedInJustfixUser().value,
      });

      await waitFor(() => {
        pal.rr.getByText(/Why mail a letter/i);
        pal.rr.getByText(/Having a record of notifying your landlord/i);
      });
    });

    it("renders in Spanish", async () => {
      i18n.initialize("es");
      const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
        url: JustfixRoutes.getLocale("es").loc.welcome,
        session: newSb().withLoggedInJustfixUser().value,
      });

      await waitFor(() => {
        pal.rr.getByText(/Por qué enviar una Carta de Queja/i);
      });
    });
  });

  describe("Letter content", () => {
    it("letter content renders (stays in English regardless of locale)", async () => {
      i18n.initialize("es");
      const pal = new ReactTestingLibraryPal(
        (
          <PreloadedLinguiI18nProvider>
            <LocContent {...locSampleProps} todaysDate="2020-06-10" />
          </PreloadedLinguiI18nProvider>
        )
      );

      await waitFor(() => {
        pal.rr.getByText(/Dear/i);
      });
    });
  });
});
