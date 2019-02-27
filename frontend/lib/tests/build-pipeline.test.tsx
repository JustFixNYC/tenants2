import autobind from 'autobind-decorator';

test("dynamic import works", () => {
  return import('./build-pipeline-dynamic-import').then(mod => {
    expect(mod.blah(5)).toEqual(6);
  });
});

test('autobind decorator works', () => {
  class Blarg {
    constructor(readonly base: number) {}

    @autobind
    boop(x: number) {
      return this.base + x;
    }
  }

  const blarg = new Blarg(6);

  expect(blarg.boop(1)).toEqual(7);
});

test('super() works', () => {
  class Foo {
    thingy: number;

    constructor() {
      this.thingy = 1;
    }
  }

  class Bar extends Foo {
    constructor() {
      super()
      this.thingy += 1;
    }
  }

  const bar = new Bar();

  expect(bar.thingy).toEqual(2);
});
