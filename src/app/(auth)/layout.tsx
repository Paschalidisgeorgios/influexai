import "@/styles/auth-glass.css";

import { FeatureSlideshow } from "@/components/auth/feature-slideshow";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page min-h-screen flex">
      <div className="hidden lg:flex lg:w-[58%] flex-col relative overflow-hidden">
        <FeatureSlideshow />
      </div>

      <div className="auth-form-side w-full lg:w-[42%] relative flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-12 min-h-screen">
        <div
          className="auth-canvas-teaser absolute inset-0 opacity-30 lg:hidden pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute inset-0 lg:hidden pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        <div className="auth-glass-card relative z-10">
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
            <LanguageSwitcher compact glassAuth />
          </div>
          <div className="auth-glass-card-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
