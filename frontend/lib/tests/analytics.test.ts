import { areAnalyticsEnabled } from "../analytics";

describe("areAnalyticsEnabled()", () => {
  const metaEl = document.createElement('meta');
  metaEl.setAttribute('name', 'enable-analytics');
  document.head.appendChild(metaEl);

  it("returns true when enabled", () => {
    metaEl.setAttribute('content', '1');
    expect(areAnalyticsEnabled()).toBe(true);
  });

  it("returns false when disabled", () => {
    metaEl.setAttribute('content', '0');
    expect(areAnalyticsEnabled()).toBe(false);
  });
});
