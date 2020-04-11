import { isNotSuingForHarassment } from "../hp-action-util";
import { BlankAllSessionInfo } from "../../queries/AllSessionInfo";
import { BlankHPActionDetails } from "../../queries/HPActionDetails";

test("isNotSuingForHarassment works", () => {
    expect(isNotSuingForHarassment(BlankAllSessionInfo)).toBe(true);
  
    [[false, true], [true, false], [null, true]].forEach(([sueForHarassment, expected]) => {
      expect(isNotSuingForHarassment({
        ...BlankAllSessionInfo,
        hpActionDetails: { ...BlankHPActionDetails, sueForHarassment }
      }))
        .toBe(expected);
    });
  });
  