export type DjangoChoice = [string, string];

export type DjangoChoices = DjangoChoice[];


export function getDjangoChoiceLabel(choices: DjangoChoices, value: string): string {
  for (let [v, label] of choices) {
    if (v === value) return label;
  }
  throw new Error(`Unable to find label for value ${value}`);
}
