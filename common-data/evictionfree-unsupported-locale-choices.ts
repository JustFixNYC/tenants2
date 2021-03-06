// This file was auto-generated by commondatabuilder.
// Please don't edit it.

export type EvictionFreeUnsupportedLocaleChoice = "fr"|"ht"|"pl"|"ru"|"ar"|"ne"|"bn"|"zh"|"ko";

export const EvictionFreeUnsupportedLocaleChoices: EvictionFreeUnsupportedLocaleChoice[] = [
  "fr",
  "ht",
  "pl",
  "ru",
  "ar",
  "ne",
  "bn",
  "zh",
  "ko"
];

const EvictionFreeUnsupportedLocaleChoiceSet: Set<String> = new Set(EvictionFreeUnsupportedLocaleChoices);

export function isEvictionFreeUnsupportedLocaleChoice(choice: string): choice is EvictionFreeUnsupportedLocaleChoice {
  return EvictionFreeUnsupportedLocaleChoiceSet.has(choice);
}

export type EvictionFreeUnsupportedLocaleChoiceLabels = {
  [k in EvictionFreeUnsupportedLocaleChoice]: string;
};

export function getEvictionFreeUnsupportedLocaleChoiceLabels(): EvictionFreeUnsupportedLocaleChoiceLabels {
  return {
    fr: "Français",
    ht: "Kreyòl ayisyen",
    pl: "Polski",
    ru: "Русский",
    ar: "العربية",
    ne: "नेपाली भाषा",
    bn: "বাংলা",
    zh: "中文",
    ko: "한국어",
  };
}
