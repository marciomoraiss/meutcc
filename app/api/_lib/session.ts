import { getSupabaseRequestContext } from "../../../lib/supabase/request";

export type SessionContext = NonNullable<Awaited<ReturnType<typeof getSupabaseRequestContext>>>;

export async function getSessionContext(request: Request) {
  return getSupabaseRequestContext(request);
}
