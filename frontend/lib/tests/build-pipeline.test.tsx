import autobind from "autobind-decorator";
import type { AllSessionInfo } from "../queries/AllSessionInfo";

test("dynamic import works", () => {
  return import("./build-pipeline-dynamic-import").then((mod) => {
    expect(mod.blah(5)).toEqual(6);
  });
});

test("import type works", () => {
  const boop: Partial<AllSessionInfo> = { phoneNumber: "5551234567" };
  expect(boop.phoneNumber).toBe("5551234567");
});

test("autobind decorator works", () => {
  class Blarg {
    constructor(readonly base: number) {}

    @autobind
    boop(x: number) {
      return this.base + x;
    }
  }

  const blarg = new Blarg(6);
  const boop = blarg.boop;

  expect(boop(1)).toEqual(7);
});

test("super() works", () => {
  class Foo {
    thingy: number;

    constructor() {
      this.thingy = 1;
    }
  }

  class Bar extends Foo {
    constructor() {
      super();
      this.thingy += 1;
    }
  }

  const bar = new Bar();

  expect(bar.thingy).toEqual(2);
});
