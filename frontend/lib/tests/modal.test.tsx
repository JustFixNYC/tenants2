import React from 'react';

import { ModalWithoutRouter, Modal } from "../modal";
import { mountWithRouter } from "./util";

describe('ModalWithoutRouter', () => {
  it('pre-renders modal when on server-side', () => {
    const ctx = { staticContext: {} } as any;
    const modal = new ModalWithoutRouter(ctx);
    modal.render();
    expect(ctx.staticContext.modal).toBeTruthy();
  });

  it('renders nothing when not active', () => {
    const modal = new ModalWithoutRouter({} as any);
    expect(modal.render()).toBeNull();
  });
});

describe('Modal', () => {
  it('renders body when mounted, renders nothing when closed', () => {
    const { wrapper } = mountWithRouter(
      <Modal title="blah"><p>hello</p></Modal>
    );
    expect(wrapper.html()).toContain("hello");

    window.scroll = jest.fn();
    wrapper.find('button[aria-label="close"]').simulate('click');
    expect(wrapper.html()).toBeNull();
  });
});
