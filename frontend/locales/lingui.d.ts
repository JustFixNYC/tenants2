/**
 * This is a temporary typings file for lingui. We can't
 * use the currently published one because we get the
 * following error in 'Trans.d.ts':
 * 
 *   error TS2314: Generic type 'ReactElement<P>' requires 1 type argument(s).
 */
declare module '@lingui/react' {
  export let I18nProvider: any;
  export let Trans: any;
}
