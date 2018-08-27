import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';

import IndexPage, { IndexPageProps  } from '../pages/index-page';

test('index page renders', () => {
  const props: IndexPageProps = {};

  const page = mount(
    <MemoryRouter>
      <IndexPage {...props} />
    </MemoryRouter>
  );

  expect(page.html()).toContain('Level the playing field');
});
