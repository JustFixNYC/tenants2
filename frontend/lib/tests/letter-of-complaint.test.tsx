import React from 'react';
import { shallowWithRouter } from "./util";
import LetterOfComplaintRoutes, { Welcome, WhyMail } from '../letter-of-complaint';

test("letter of complaint routes render without throwing", () => {
  [
    <Welcome />,
    <WhyMail />,
    <LetterOfComplaintRoutes />,
  ].forEach(child => shallowWithRouter(child).wrapper.html());
});
