import { ga, trackPageView } from "../google-analytics";

describe("ga()", () => {
  describe("if window.ga is undefined", () => {
    beforeEach(() => {
      delete window.ga;
      jest.useFakeTimers();
    });

    it("does not explode", () => {
      ga("set", "page", "/blah");
    });

    it("calls any hit callbacks almost immediately", () => {
      const hitCallback = jest.fn();
      ga("send", "event", "outbound", "click", "https://boop.com/", {
        transport: "beacon",
        hitCallback,
      });
      expect(hitCallback.mock.calls).toHaveLength(0);
      jest.advanceTimersByTime(10);
      expect(hitCallback.mock.calls).toHaveLength(1);
    });
  });

  it("calls window.ga if it is defined", () => {
    const mockGa = jest.fn();
    window.ga = mockGa;
    ga("set", "page", "/blah");
    expect(mockGa.mock.calls).toHaveLength(1);
    expect(mockGa.mock.calls[0]).toEqual(["set", "page", "/blah"]);
    delete window.ga;
  });
});

test("helper functions do not explode", () => {
  trackPageView("/blah");
});
