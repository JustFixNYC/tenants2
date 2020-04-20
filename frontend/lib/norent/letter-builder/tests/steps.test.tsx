import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { getNoRentLetterBuilderProgressRoutesProps } from "../steps";

const tester = new ProgressRoutesTester(
  getNoRentLetterBuilderProgressRoutesProps(),
  "NoRent letter builder flow"
);

tester.defineSmokeTests();
