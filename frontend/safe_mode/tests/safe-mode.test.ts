import "../safe-mode";

window.SafeMode.appIsReady();

describe("safe mode", () => {
  const HIDDEN_ATTR = "data-safe-mode-hidden";

  let div = document.createElement("div");
  let deleteBtn = document.createElement("button");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();

    div = document.createElement("div");
    div.id = "safe-mode-enable";
    div.setAttribute(HIDDEN_ATTR, "");
    document.body.appendChild(div);

    deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    div.appendChild(deleteBtn);

    window.ga = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(div);
  });

  it("shows UI when instructed to", () => {
    window.SafeMode.showUI();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(true);
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
  });

  it("works if showUI() is called multiple times", () => {
    const clearTimeoutMock = jest.spyOn(window, "clearTimeout");
    window.SafeMode.showUI();
    expect(clearTimeoutMock.mock.calls).toHaveLength(0);
    window.SafeMode.showUI();
    expect(clearTimeoutMock.mock.calls).toHaveLength(1);
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(true);
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
  });

  it("hides UI when close button is clicked", () => {
    window.SafeMode.showUI();
    jest.runAllTimers();
    if (!deleteBtn.onclick) {
      throw new Error("delete button should have onclick defined");
    }
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
    deleteBtn.onclick(null as any);
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(true);
  });

  it("shows UI if error is undefined", () => {
    window.SafeMode.reportError(undefined as any);
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
  });

  it("shows UI if error.toString() throws", () => {
    window.SafeMode.reportError({
      toString() {
        throw new Error();
      },
    } as any);
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
  });

  it("shows UI if a non-ignored error is reported", () => {
    window.SafeMode.ignoreError(new Error("blap"));
    window.SafeMode.reportError(new Error("boop"));
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(false);
  });

  it("does not show UI on pre-ignored errors", () => {
    const err = new Error("boop");
    window.SafeMode.ignoreError(err);
    window.SafeMode.reportError(err);
    jest.runAllTimers();
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(true);
  });

  it("does not show UI on post-ignored errors", () => {
    const err = new Error("bap");
    window.SafeMode.reportError(err);
    jest.runTimersToTime(10);
    window.SafeMode.ignoreError(err);
    jest.runTimersToTime(1000);
    expect(div.hasAttribute(HIDDEN_ATTR)).toBe(true);
  });
});
