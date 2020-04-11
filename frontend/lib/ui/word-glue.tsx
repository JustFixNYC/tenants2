import React from 'react';

/**
 * Given a string, trim any leading/trailing whitespace and return
 * a two-element Array consisting of all the word(s) leading up to
 * the last word, and the last word.
 * 
 * If the text doesn't have at least two words, null is returned.
 */
export function splitLastWord(text: string): [string, string]|null {
  text = text.trim();
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace === -1) {
    return null;
  }
  return [text.slice(0, lastSpace), text.slice(lastSpace + 1)];
}

/**
 * "Glues" the given text to the given element, ensuring that the
 * element won't wrap around to another line by itself, orphaned
 * from the text.
 */
export function glueToText(text: string, element: JSX.Element): JSX.Element {
  return <span className="jf-word-glue">{text}{element}</span>;
}

/**
 * "Glues" the last word of the given text to the given element,
 * ensuring the element will always be visually conjoined to the last word.
 */
export function glueToLastWord(text: string, element: JSX.Element): JSX.Element {
  const result = splitLastWord(text);

  if (!result) return glueToText(text, element);

  const [words, lastWord] = result;

  return <>{words}{' '}{glueToText(lastWord, element)}</>;
}
