// UI-only display mapping for firm identities.
//
// The model layer (src/model/**) keeps its internal, test-asserted names
// ('Leader' / 'Follower A' / 'Follower B'); those strings are the numerical
// oracle and must never change. This helper renames them for DISPLAY only, at
// every place a firm's name is shown to a reader. It is a pure string map and is
// safe to call on any string — unknown names (e.g. 'Hyperscaler', 'Follower C',
// or an already-renamed label) pass straight through unchanged.

const FIRM_DISPLAY_NAMES: Record<string, string> = {
  Leader: 'Lab 1',
  'Follower A': 'Lab 2',
  'Follower B': 'Lab 3',
}

/** Map an internal firm name to its user-facing label. Identity for anything else. */
export function firmDisplayName(name: string): string {
  return FIRM_DISPLAY_NAMES[name] ?? name
}
