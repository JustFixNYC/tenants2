import React from "react";

import { preloadLingui } from "../../tests/lingui-preloader";
import { LinguiI18n } from "../../i18n-lingui";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { CharsRemaining } from "../chars-remaining";

beforeAll(preloadLingui(LinguiI18n));

describe("<CharsRemaining>", () => {
  it("works when 1 character remains", () => {
    const pal = new AppTesterPal(<CharsRemaining max={15} current={14} />);
    expect(pal.rr.container.firstChild).toMatchSnapshot();
  });

  it("works when many characters remain", () => {
    const pal = new AppTesterPal(<CharsRemaining max={15} current={1} />);
    expect(pal.rr.container.firstChild).toMatchSnapshot();
  });

  it("supports use of spans", () => {
    const pal = new AppTesterPal(
      <CharsRemaining max={15} current={1} useSpan />
    );
    expect(pal.rr.container.firstChild).toMatchSnapshot();
  });
});
