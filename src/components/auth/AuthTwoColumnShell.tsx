import Link from "next/link";
import { X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

type AuthTwoColumnShellProps = {
  children: React.ReactNode;
};

export function AuthTwoColumnShell({ children }: AuthTwoColumnShellProps) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-x-clip bg-[#050505] p-4">
      <div className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/50 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <div className="relative flex flex-col justify-center p-8 md:p-12">
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher compact glassAuth />
          </div>
          {children}
        </div>

        <div className="relative hidden min-h-[450px] md:block">
          <video
            src="/videos/landing/seedance-2-0.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"
            aria-hidden
          />
          <Link
            href="/"
            className="absolute top-4 right-4 rounded-full bg-zinc-900/60 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Zur Startseite"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
