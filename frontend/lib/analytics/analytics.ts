import { getHTMLElement } from "@justfixnyc/util";

/**
 * The name of the custom meta tag we use to communicate from
 * server to client whether analytics are enabled.
 */
const META_VAR_NAME = 'enable-analytics';

/**
 * Returns whether analytics have been enabled on this page
 * by the server-generated markup.
 */
export function areAnalyticsEnabled(): boolean {
  const metaEl = getHTMLElement('meta', `[name="${META_VAR_NAME}"]`);
  return metaEl.getAttribute('content') === '1';
}
