import type { StorageAdapter } from "../types";

/** Default adapter: does nothing. Used when a host hasn't configured a
 * backend — the banner still works, decisions just aren't logged anywhere. */
export function noopAdapter(): StorageAdapter {
  return {
    log() {
      /* no-op */
    },
  };
}
