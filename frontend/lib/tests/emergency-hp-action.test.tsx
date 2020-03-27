import { ProgressRoutesTester } from './progress-routes-tester';
import { getEmergencyHPActionProgressRoutesProps } from '../emergency-hp-action';

const tester = new ProgressRoutesTester(getEmergencyHPActionProgressRoutesProps(), 'Emergency HP Action');

tester.defineSmokeTests();
