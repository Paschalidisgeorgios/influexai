import Link from "next/link";

export default function CommunityNotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6"
      style={{ background: "#060608" }}
    >
      <h1 className="text-2xl font-bold text-[#F0EFE8]">Nicht gefunden</h1>
      <Link href="/community" className="text-[#B4FF00] font-semibold text-sm">
        Zur Community →
      </Link>
    </div>
  );
}
