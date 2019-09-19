import { ProgressRoutesTester } from './progress-routes-tester';
import { getRentalHistoryRoutesProps } from '../rental-history';

const tester = new ProgressRoutesTester(getRentalHistoryRoutesProps(), 'Rental History');

tester.defineSmokeTests();


