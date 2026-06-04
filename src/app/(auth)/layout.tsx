import { FeatureSlideshow } from "@/components/auth/feature-slideshow";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#060608]">
      <div className="hidden lg:flex lg:w-[60%] bg-[#060608] flex-col relative overflow-hidden">
        <FeatureSlideshow />
      </div>
      <div className="w-full lg:w-[40%] bg-[#0a0a0a] flex flex-col justify-center px-8 py-12 min-h-screen relative">
        {children}
      </div>
    </div>
  );
}
