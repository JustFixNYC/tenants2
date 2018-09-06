import React from 'react';
import { shallowWithRouter } from "./util";
import LetterOfComplaintRoutes, { Welcome, WhyMail, Issues } from '../letter-of-complaint';

test("letter of complaint routes render without throwing", () => {
  [
    <Welcome />,
    <WhyMail />,
    <Issues />,
    <LetterOfComplaintRoutes />,
  ].forEach(child => shallowWithRouter(child).wrapper.html());
});
