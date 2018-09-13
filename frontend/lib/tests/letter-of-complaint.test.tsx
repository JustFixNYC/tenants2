import React from 'react';
import { shallowWithRouter } from "./util";
import LetterOfComplaintRoutes, { Welcome, WhyMail, Confirmation } from '../letter-of-complaint';

test("letter of complaint routes render without throwing", () => {
  [
    <Welcome />,
    <WhyMail />,
    <LetterOfComplaintRoutes />,
    <Confirmation/>,
  ].forEach(child => shallowWithRouter(child).wrapper.html());
});
