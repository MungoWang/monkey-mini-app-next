/**
 * Sandbox tokens for the app iframe.
 * Top navigation is absent, so a link, a script, or a form cannot replace the panel.
 * The sandbox does not stop the iframe from navigating itself. The runner guard does that.
 * The window navigation handler cancels a foreign load even if the page removes the guard.
 * Scripts and same-origin Host calls stay allowed. A popup opens a normal browser tab.
 * This is not confinement: a script that can reach the parent document can remove the attribute.
 */
export const appFrameSandbox = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-modals',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-downloads',
].join(' ')
