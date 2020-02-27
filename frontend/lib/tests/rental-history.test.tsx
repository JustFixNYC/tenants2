import React from 'react';

import { ProgressRoutesTester } from './progress-routes-tester';
import RentalHistoryRoutes, { getRentalHistoryRoutesProps } from '../rental-history';
import Routes from '../routes';
import { AppTesterPal } from './app-tester-pal';
import  {OnboardingInfoBorough, OnboardingInfoSignupIntent }  from '../queries/globalTypes';

const tester = new ProgressRoutesTester(getRentalHistoryRoutesProps(), 'Rental History');

tester.defineSmokeTests();

describe('Rental history frontend', () => {
    it('returns splash page by default', () => {
      expect(tester.getLatestStep()).toBe(Routes.locale.rh.splash);
    });
  
    it('returns splash even if user is logged in', () => {
      expect(tester.getLatestStep({
        phoneNumber: '5551234567'
      })).toBe(Routes.locale.rh.splash);
    });

    it('shows user details on form if user is logged in', () => {
        const pal = new AppTesterPal(<RentalHistoryRoutes />, {
          url: Routes.locale.rh.form,
          session: {
            userId: 1,
            firstName: 'boop',
            lastName: 'jones',
            phoneNumber: '2120000000',
            onboardingInfo: {
              aptNumber: '2',
              address: "150 DOOMBRINGER STREET",
              borough: OnboardingInfoBorough.MANHATTAN,
              floorNumber: null,
              signupIntent: OnboardingInfoSignupIntent.LOC
            },
          }
        });
        const inputFirstName = pal.rr.getByLabelText('First name') as HTMLInputElement;
        expect(inputFirstName.value).toEqual('boop');
        const inputLastName = pal.rr.getByLabelText('Last name') as HTMLInputElement;
        expect(inputLastName.value).toEqual('jones');
        const inputAddress = pal.rr.getAllByLabelText(/address/i)[0] as HTMLInputElement;
        expect(inputAddress.value).toEqual('150 DOOMBRINGER STREET, Manhattan');
        const inputApt = pal.rr.getByLabelText('Apartment number') as HTMLInputElement;
        expect(inputApt.value).toEqual('2');
        const inputPhone = pal.rr.getByLabelText('Phone number') as HTMLInputElement;
        expect(inputPhone.value).toEqual('(212) 000-0000');

      });

    //   it('deletes user details on clicking cancel button', () => {
    //     const pal = new AppTesterPal(<RentalHistoryRoutes />, {
    //       url: Routes.locale.rh.form,
    //       session: {
    //         rentalHistoryInfo: {
    //           firstName: 'boop',
    //           lastName: 'jones',
    //           address: "150 DOOMBRINGER STREET",
    //           apartmentNumber: '2',
    //           phoneNumber: '2120000000',
    //           borough: 'MANHATTAN',
    //           zipcode: '10001',
    //           addressVerified: true,
    //         },
    //       }
    //     });
    //     const inputAddress = pal.rr.getAllByLabelText(/address/i)[0] as HTMLInputElement;
    //     expect(inputAddress.value).toEqual('150 DOOMBRINGER STREET, Manhattan');
    //     const inputPhone = pal.rr.getAllByLabelText('Phone number')[0] as HTMLInputElement;
    //     expect(inputPhone.value).toEqual('(212) 000-0000');

    //     pal.clickButtonOrLink('Cancel request');
    //     pal.expectFormInput({});

    //   });

    /* GIVES ERROR: 
    Found at least one element with label text "Cancel request" 
    (<button>, <button>), but more than one matches the selector "a, button, a > 
    .jf-sr-only, button > .jf-sr-only" */

  });
