import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { getNorentAccountProgressRoutesProps } from "../steps";

const tester = new ProgressRoutesTester(
  getNorentAccountProgressRoutesProps(),
  "NoRent account flow"
);

tester.defineSmokeTests();
