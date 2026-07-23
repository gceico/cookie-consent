import type { StorageAdapter } from "../types";
import { noopAdapter } from "./none";

export type { StorageAdapter } from "../types";
export { noopAdapter } from "./none";
export { supabaseAdapter } from "./supabase";
export type { SupabaseAdapterOptions } from "./supabase";
export { restAdapter } from "./rest";
export type { RestAdapterOptions } from "./rest";

/** Returns the given adapter, or `noopAdapter()` when none was supplied.
 * Small helper so call sites don't need an `?? noopAdapter()` inline. */
export function resolveAdapter(adapter?: StorageAdapter): StorageAdapter {
  return adapter ?? noopAdapter();
}
