import Link from "next/link";
import { X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LANDING_VIDEOS } from "@/lib/landing-video-urls";

type AuthTwoColumnShellProps = {
  children: React.ReactNode;
};

export function AuthTwoColumnShell({ children }: AuthTwoColumnShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4">
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="absolute -top-11 right-0 z-20 sm:-top-12">
          <LanguageSwitcher compact glassAuth />
        </div>

        <div className="relative grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/40 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">{children}</div>

          <div className="relative hidden h-full min-h-[480px] w-full md:block">
            <video
              src={LANDING_VIDEOS.seedance20}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
            <Link
              href="/"
              className="absolute top-4 right-4 cursor-pointer rounded-full bg-zinc-900/60 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Zur Startseite"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
