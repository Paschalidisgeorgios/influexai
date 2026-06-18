import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/account-delete";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht eingeloggt.", code: "NOT_AUTHENTICATED" },
      { status: 401 }
    );
  }

  const result = await deleteUserAccount(user.id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
