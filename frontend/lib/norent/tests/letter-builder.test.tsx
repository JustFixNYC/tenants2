import { ProgressRoutesTester } from "../../progress/tests/progress-routes-tester";
import { getNoRentLetterProgressRoutesProps } from "../letter-builder";

const tester = new ProgressRoutesTester(
  getNoRentLetterProgressRoutesProps(),
  "NoRent letter builder"
);

tester.defineSmokeTests();
