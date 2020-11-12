import { privateLandlordHelpersForTesting } from "../landlord";

const { shouldUseRecommendedLandlordInfo } = privateLandlordHelpersForTesting;

describe("shouldUseRecommendedLandlordInfo()", () => {
  it("Returns true when LL is currently manually specified but user wants to force recommended", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: true,
        forceManual: false,
        forceRecommended: true,
      })
    ).toBe(true);
  });

  it("Returns false when LL is currently manually specified and user has no opinion", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: true,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(false);
  });

  it("Returns true when recommendation exists and user has no opinion", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(true);
  });

  it("Returns false when recommendation exists and user wants to force manual", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: true,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: true,
        forceRecommended: false,
      })
    ).toBe(false);
  });

  it("Returns false when no recommendation exists", () => {
    expect(
      shouldUseRecommendedLandlordInfo({
        hasRecommendedLandlord: false,
        isLandlordAlreadyManuallySpecified: false,
        forceManual: false,
        forceRecommended: false,
      })
    ).toBe(false);
  });
});
