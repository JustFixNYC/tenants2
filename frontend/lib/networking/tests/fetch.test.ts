import {
  awesomeFetch,
  createAbortController,
  dynamicallyImportFetch,
} from "../fetch";

describe("awesomeFetch()", () => {
  it("uses existing fetch implementation if found", () => {
    window.fetch = jest.fn().mockResolvedValue("LOL HI");
    return expect(awesomeFetch("bop")).resolves.toEqual("LOL HI");
  });

  it("dynamically loads fetch implementation if needed", () => {
    delete (window as any).fetch;
    return expect(awesomeFetch("aweogjaowejg")).rejects.toThrow(
      /only absolute urls are supported/i
    );
  });
});

describe("createAbortController", () => {
  it("returns AbortController existence if it exists", () => {
    expect(createAbortController()).toBeInstanceOf(AbortController);
  });

  it("returns undefined if AbortController does not exist", () => {
    const old = AbortController;
    delete (window as any).AbortController;
    try {
      expect(createAbortController()).toBeUndefined();
    } finally {
      (window as any).AbortController = old;
    }
  });
});

test("dynamicallyImportFetch() always returns the same promise", () => {
  expect(dynamicallyImportFetch()).toBe(dynamicallyImportFetch());
});
