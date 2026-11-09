/**
 * Node half of the balance monitor plugin.
 *
 * Every user-visible contribution lives in the browser half (`lib/client.js`):
 * the balance bar, the detail panel, the threshold settings, and the low-balance
 * reminder. This entry exists so the package appears as an ordinary Loader row,
 * which is what makes the Host serve and hot-load the client bundle.
 *
 * @module dsh-balance-monitor
 */

/** Loader-visible no-op body; the browser half carries the feature. */
export function apply() {}
