import Link from "next/link";

export function BlogPagination({
  page,
  totalPages,
  category,
}: {
  page: number;
  totalPages: number;
  category: string | null;
}) {
  if (totalPages <= 1) return null;

  const linkFor = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (category && category !== "Alle") params.set("category", category);
    return `/blog?${params}`;
  };

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={linkFor(p)}
          className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
            p === page
              ? "bg-[#B4FF00] text-black"
              : "border border-white/10 text-white/60 hover:border-[#B4FF00]/40 hover:text-white"
          }`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
