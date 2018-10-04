import React from 'react';
import { shallowWithRouter } from "./util";
import LetterOfComplaintRoutes, { Welcome } from '../letter-of-complaint';

test("letter of complaint routes render without throwing", () => {
  [
    <Welcome />,
    <LetterOfComplaintRoutes />,
  ].forEach(child => shallowWithRouter(child).wrapper.html());
});
