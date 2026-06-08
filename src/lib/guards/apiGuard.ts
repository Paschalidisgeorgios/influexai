/** @deprecated Use assertKiToolAccess / assertActivePlan from @/lib/access.server */
import { assertActivePlan, assertKiToolAccess } from "@/lib/access.server";

export { assertKiToolAccess };

/** @deprecated Use assertActivePlan() or assertKiToolAccess(amount) instead. */
export async function withPlanGuard(_userId?: string) {
  void _userId;
  return assertActivePlan();
}
