import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6">
      <h1 className="text-2xl font-bold text-[#F0EFE8]">
        Seite nicht gefunden
      </h1>
      <p className="text-white/80 text-sm">
        Dieses Dashboard-Modul existiert nicht.
      </p>
      <Link
        href="/dashboard"
        className="text-[#B4FF00] font-semibold text-sm hover:underline"
      >
        Zum Dashboard →
      </Link>
    </div>
  );
}
