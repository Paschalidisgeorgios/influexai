import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060608",
      color: "#F0EFE8",
      fontFamily: "var(--font-dm), sans-serif",
    }}>
      {/* Admin Nav */}
      <nav style={{
        padding: "14px clamp(16px,5vw,48px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#0f0f12",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "#B4FF00",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "0.9rem", color: "#060608",
          }}>I</div>
          <span style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1rem", letterSpacing: "0.04em",
          }}>
            Influex<span style={{ color: "#B4FF00" }}>AI</span>
          </span>
          <span style={{
            padding: "2px 8px", borderRadius: 5,
            background: "rgba(255,71,87,0.15)",
            border: "1px solid rgba(255,71,87,0.3)",
            color: "#ff6b7a", fontSize: "0.68rem", fontWeight: 700,
          }}>
            ADMIN
          </span>
        </div>
        <a href="/dashboard" style={{
          color: "#505055", fontSize: "0.85rem",
          textDecoration: "none", fontWeight: 500,
        }}>
          ← Zurück zum Dashboard
        </a>
      </nav>
      <main style={{ padding: "clamp(24px,4vw,40px) clamp(16px,5vw,48px)" }}>
        {children}
      </main>
    </div>
  );
}
