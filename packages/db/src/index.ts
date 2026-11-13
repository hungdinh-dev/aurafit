/**
 * @aurafit/db – Supabase types for AuraFit.
 *
 * `database.types.ts` has the exact shape of `supabase gen types typescript`, so the app can do
 * `createClient<Database>(url, key)`. It is generated from `supabase/migrations` (see
 * `supabase/README.md` → "Database types"); never edit it by hand.
 */
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './database.types';
export { Constants } from './database.types';
export { DbValues } from './values';
export type { DbValue } from './values';

import type { Database } from './database.types';

type PublicSchema = Database['public'];

/** Row type of a public view, e.g. `ViewRow<'public_profiles'>`. */
export type ViewRow<V extends keyof PublicSchema['Views']> = PublicSchema['Views'][V]['Row'];

/** Args / return type of an RPC, e.g. `RpcArgs<'redeem_invite'>`. */
export type RpcArgs<F extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][F]['Args'];
export type RpcReturns<F extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][F]['Returns'];

/** Storage buckets created by the migrations. */
export const StorageBuckets = {
  mealPhotos: 'meal-photos',
  taskPhotos: 'task-photos',
  exerciseMedia: 'exercise-media',
} as const;
