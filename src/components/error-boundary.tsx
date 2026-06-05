"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 px-6">
      <p className="text-white/80 text-sm text-center">
        Etwas ist schiefgelaufen.
        {error?.message ? (
          <span className="block mt-2 text-white/65 text-xs">
            {error.message}
          </span>
        ) : null}
      </p>
      <button
        type="button"
        onClick={reset}
        className="border border-[#B4FF00]/30 text-[#B4FF00] px-4 py-2 rounded-lg hover:bg-[#B4FF00]/10 transition-colors text-sm font-semibold"
      >
        Nochmal versuchen
      </button>
    </div>
  );
}
