import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  assertAdminOrderV2Ok,
  toAdminOrderV2Response,
  type AdminOrderV2RpcName,
} from "@/admin/repositories/order-v2-contracts";

export async function callAdminOrderV2Rpc<TData>(
  name: AdminOrderV2RpcName,
  payload: Record<string, unknown>,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc(name, { payload });

  if (error) throw new Error(error.message);

  return assertAdminOrderV2Ok(toAdminOrderV2Response<TData>(data));
}
