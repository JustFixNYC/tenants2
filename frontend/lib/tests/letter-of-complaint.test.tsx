import React from 'react';
import { shallowWithRouter } from "./util";
import LetterOfComplaintRoutes, { Welcome, WhyMail, PreviewLetter } from '../letter-of-complaint';

test("letter of complaint routes render without throwing", () => {
  [
    <Welcome />,
    <WhyMail />,
    <LetterOfComplaintRoutes />,
    <PreviewLetter/>,
  ].forEach(child => shallowWithRouter(child).wrapper.html());
});
