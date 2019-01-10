import React from 'react';

import ReactTestingLibraryPal from "./rtl-pal";
import { Formset } from '../formset';
import { TextualFormField } from '../form-fields';

describe('Formset', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('works', () => {
    type MyItem = { foo: string; bar: string };
    const emptyForm: MyItem = { foo: '', bar: '' };
    const items: MyItem[] = [
      {foo: 'hi', bar: 'a'},
      {foo: 'there', bar: 'b'}
    ];
    const onChange = jest.fn();
    const pal = new ReactTestingLibraryPal(
      <Formset items={items} onChange={onChange} idPrefix="blarg"
               isLoading={false} name="blop" emptyForm={emptyForm}>
        {(ctx, i) => <>
          <TextualFormField label={`Foo ${i}`} {...ctx.fieldPropsFor('foo')} />
          <TextualFormField label={`Bar ${i}`} {...ctx.fieldPropsFor('bar')} />
        </>}
      </Formset>
    );
    const foo0 = pal.getFormField('Foo 0');
    expect(foo0.value).toEqual('hi');
    expect(foo0.name).toEqual('blop-0-foo');

    const foo2 = pal.getFormField('Foo 2');
    expect(foo2.value).toEqual('');

    pal.fillFormFields([['Foo 0', 'hiii']]);
    expect(onChange).toHaveBeenCalledWith([
      {foo: 'hiii', bar: 'a'},
      {foo: 'there', bar: 'b'}
    ]);
  });
});
