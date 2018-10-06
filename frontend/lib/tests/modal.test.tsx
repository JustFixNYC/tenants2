import React from 'react';

import { ModalWithoutRouter, Modal } from "../modal";
import { mountWithRouter } from "./util";

describe('ModalWithoutRouter', () => {
  it('pre-renders modal when on server-side', () => {
    const ctx = { staticContext: {}, onCloseGoTo: '/' } as any;
    const modal = new ModalWithoutRouter(ctx);
    modal.render();
    expect(ctx.staticContext.modal).toBeTruthy();
  });

  it('renders nothing when not active', () => {
    const modal = new ModalWithoutRouter({ onCloseGoTo: '/' } as any);
    expect(modal.render()).toBeNull();
  });
});

describe('Modal', () => {
  it('removes pre-rendered modal on mount', () => {
    const div = document.createElement('div');
    div.id = 'prerendered-modal';
    document.body.appendChild(div);
    expect(div.parentNode).toBe(document.body);
    mountWithRouter(<Modal title="blah" onCloseGoTo="/"><p>hello</p></Modal>);
    expect(div.parentNode).toBeNull();
  });

  it('renders body when mounted, renders nothing when closed', () => {
    const { wrapper } = mountWithRouter(
      <Modal title="blah" onCloseGoTo="/"><p>hello</p></Modal>
    );
    expect(wrapper.html()).toContain("hello");

    wrapper.find('a[aria-label="close"]').simulate('click');
    expect(wrapper.html()).toBeNull();
  });
});
