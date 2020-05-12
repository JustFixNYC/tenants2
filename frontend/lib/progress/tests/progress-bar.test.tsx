import React from "react";

import { ProgressBar, RouteProgressBar } from "../progress-bar";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { FakeRequestAnimationFrame } from "../../tests/fake-raf";
import { ProgressStepRoute } from "../progress-step-route";

const fakeSteps: ProgressStepRoute[] = [
  {
    component: () => <p>I am foo</p>,
    path: "/foo",
    exact: true,
  },
  {
    component: () => <p>I am foo 2</p>,
    path: "/foo/2",
  },
  {
    component: () => <p>I am foo 3</p>,
    path: "/foo/3",
  },
];

describe("ProgressBar", () => {
  it("works", () => {
    const fakeRaf = new FakeRequestAnimationFrame();
    const pal = new AppTesterPal(<ProgressBar pct={0} />);
    const pct = () => pal.getElement("progress", "").getAttribute("value");
    expect(pct()).toBe("0");
    pal.rerender(<ProgressBar pct={5} />);
    expect(pct()).toBe("0");
    [1, 2, 3, 4, 5].forEach((n) => {
      fakeRaf.runCallbacks();
      expect(pct()).toBe(`${n}`);
    });
    fakeRaf.runCallbacks();
    expect(pct()).toBe("5");
  });

  it("unregisters callback on unmount", () => {
    const fakeRaf = new FakeRequestAnimationFrame();
    const pal = new AppTesterPal(<ProgressBar pct={0} />);
    pal.rerender(<ProgressBar pct={5} />);
    expect(fakeRaf.callbacks).toHaveLength(1);
    pal.rerender(<br />);
    expect(fakeRaf.callbacks).toHaveLength(0);
  });
});

describe("RouteProgressBar", () => {
  it("properly animates forward and backward", () => {
    const pal = new AppTesterPal(
      <RouteProgressBar label="foo" steps={fakeSteps} />,
      {
        url: "/foo",
      }
    );
    pal.rr.getByText("foo: Step 1 of 3");

    pal.history.push("/foo/2");
    pal.rr.getByText("foo: Step 2 of 3");
    pal.getElement("div", ".jf-progress-forward");

    pal.history.push("/foo/2/funky-modal");
    pal.rr.getByText("foo: Step 2 of 3");

    pal.history.push("/foo");
    pal.rr.getByText("foo: Step 1 of 3");
    pal.getElement("div", ".jf-progress-backward");
  });
});
