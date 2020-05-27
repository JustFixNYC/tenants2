import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NorentLetterEmailToUser } from "../letter-email-to-user";
import { NorentI18nProviderForTests } from "./i18n-provider-for-tests";

describe("NorentLetterEmailToUser", () => {
  it("works", () => {
    const pal = new AppTesterPal(
      (
        <NorentI18nProviderForTests>
          <NorentLetterEmailToUser />
        </NorentI18nProviderForTests>
      ),
      {
        session: { firstName: "Boop" },
      }
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});
