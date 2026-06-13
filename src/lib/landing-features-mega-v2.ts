export type MegaMenuItem = {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
};

export type MegaMenuSection = {
  id: string;
  label: string;
  items: MegaMenuItem[];
};

export const FEATURES_MEGA_MENU_SECTIONS: MegaMenuSection[] = [
  {
    id: "generate",
    label: "Generate",
    items: [
      {
        emoji: "🖼️",
        title: "AI Image Generation",
        subtitle: "Text to Image & Realtime Canvas",
        href: "/dashboard/image-generator",
      },
      {
        emoji: "📹",
        title: "AI Video Generation",
        subtitle: "Text to Video & Motion Transfer",
        href: "/dashboard/szenen-generator",
      },
      {
        emoji: "📦",
        title: "AI 3D Generation",
        subtitle: "Text to 3D Assets & Objects",
        href: "/dashboard/character-studio",
      },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    items: [
      {
        emoji: "🪄",
        title: "AI Image Enhancements",
        subtitle: "Upscaling, Enhancer & Editor",
        href: "/dashboard/upscaler",
      },
      {
        emoji: "🎬",
        title: "AI Video Enhancements",
        subtitle: "Style Transfer & Upscaling",
        href: "/dashboard/video-transformer",
      },
    ],
  },
  {
    id: "customize",
    label: "Customize",
    items: [
      {
        emoji: "🧬",
        title: "AI Finetuning",
        subtitle: "Image & Video LoRA Trainings",
        href: "/dashboard/lora-training",
      },
      {
        emoji: "📁",
        title: "File Management",
        subtitle: "Asset Manager & Storage",
        href: "/dashboard/gallery",
      },
    ],
  },
];

export const FEATURES_MEGA_PROMO = {
  imageSrc: "/images/landing/hero-2.jpg",
  prompt: "People running, risograph poster",
  cta: "Generate with Influex 2",
  href: "/auth/sign-up",
} as const;
