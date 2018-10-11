export function areArraysEqualIgnoringOrder(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;

  const bSet = new Set(b);

  for (let aItem of a) {
    if (!bSet.has(aItem)) return false;
  }

  return true;
}

export function areFieldsEqual<FormInput>(initial: FormInput, current: FormInput): boolean {
  for (let key in initial) {
    const initialValue = initial[key];
    const currentValue = current[key];
    if (initialValue !== currentValue) {
      if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
        if (!areArraysEqualIgnoringOrder(initialValue, currentValue)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  return true;
}
