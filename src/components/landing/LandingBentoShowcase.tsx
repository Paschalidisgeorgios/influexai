"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";

type BentoCardData = {
  id: string;
  tag: string;
  title: string;
  description: string;
  href: string;
  large?: boolean;
  accent?: boolean;
  image?: string;
  checkItems?: string[];
};

const BENTO_CARDS: BentoCardData[] = [
  {
    id: "agent",
    tag: "AUTOMATION · NEU",
    title: "AGENT AUTOPILOT",
    description:
      "Beschreibe was du brauchst — der Agent wählt Tools, erstellt Content und liefert fertige Ergebnisse.",
    href: "/dashboard",
    large: true,
    accent: true,
    checkItems: [
      "✓ Hook-Generierung erkannt",
      "✓ Nische: Fitness · Instagram",
      "› Erstelle 7-Tage Content-Plan...",
    ],
  },
  {
    id: "szenen",
    tag: "VIDEO",
    title: "SZENEN GENERATOR",
    description: "Bild zu Video · bis 15s · mehrere Modelle",
    href: "/dashboard/szenen-generator",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80",
  },
  {
    id: "ki-ich",
    tag: "AVATAR",
    title: "KI-ICH STUDIO",
    description: "Dein Gesicht. Einmal trainiert. Unbegrenzt nutzbar.",
    href: "/dashboard/ki-influencer",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
  },
  {
    id: "bild",
    tag: "VISUALS",
    title: "BILD GENERATOR",
    description: "Deutsch eingeben · Flux Pro Qualität raus.",
    href: "/dashboard/image-generator",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
  },
  {
    id: "uebersetzer",
    tag: "ÜBERSETZUNG",
    title: "VIDEO ÜBERSETZER",
    description: "Dein Video. 155+ Sprachen. Lipsync inklusive.",
    href: "/dashboard/video-uebersetzer",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
  },
];

type BentoCardProps = {
  card: BentoCardData;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onLongHover: () => void;
};

function BentoCard({ card, hoveredId, onHover, onLongHover }: BentoCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const parallax = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [checkIndex, setCheckIndex] = useState(0);

  const isHovered = hoveredId === card.id;
  const isNeighbor = hoveredId !== null && hoveredId !== card.id;

  useEffect(() => {
    const tick = () => {
      parallax.current.x += (target.current.x - parallax.current.x) * 0.07;
      parallax.current.y += (target.current.y - parallax.current.y) * 0.07;
      setOffset({ x: parallax.current.x, y: parallax.current.y });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (!card.checkItems?.length) return;
    const timer = window.setInterval(() => {
      setCheckIndex((i) => (i + 1) % card.checkItems!.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [card.checkItems]);

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    target.current = { x: -px * 16, y: -py * 16 };
  };

  const handleEnter = () => {
    onHover(card.id);
    hoverTimer.current = setTimeout(() => onLongHover(), 2000);
  };

  const handleLeave = () => {
    onHover(null);
    target.current = { x: 0, y: 0 };
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  return (
    <Link
      ref={cardRef}
      href={card.href}
      className={`group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border no-underline backdrop-blur-xl will-change-transform ${
        card.large ? "md:col-span-2 md:min-h-[280px]" : ""
      }`}
      style={{
        background: "rgba(255,255,255,0.025)",
        borderWidth: "0.5px",
        borderColor: card.accent
          ? "rgba(180,255,0,0.2)"
          : isHovered
            ? "var(--theme-accent-30)"
            : "rgba(255,255,255,0.06)",
        transform: isHovered
          ? "scale(1.02)"
          : isNeighbor
            ? "scale(0.99)"
            : "scale(1)",
        opacity: isNeighbor ? 0.92 : 1,
        boxShadow: isHovered
          ? card.accent
            ? "0 0 30px rgba(180,255,0,0.12)"
            : "0 0 30px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.1)"
          : "none",
        transition: isHovered
          ? "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s, box-shadow 0.3s, opacity 0.4s"
          : "transform 0.4s ease, border-color 0.3s, opacity 0.4s",
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
    >
      {card.image && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <img
            src={card.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover will-change-transform"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(1.08)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.4) 55%, transparent 100%)",
            }}
          />
        </div>
      )}
      <div className="relative z-[1] flex h-full flex-col p-6">
        <span
          className="mb-3 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{
            borderColor: card.accent
              ? "rgba(180,255,0,0.25)"
              : "var(--theme-accent-25)",
            background: card.accent
              ? "rgba(180,255,0,0.08)"
              : "var(--theme-accent-08)",
            color: card.accent ? "#B4FF00" : "var(--theme-accent)",
          }}
        >
          {card.tag}
        </span>
        <h3
          className="mb-2 font-display text-white"
          style={{
            fontSize: card.large ? "clamp(1.35rem, 2.5vw, 1.75rem)" : "1.25rem",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          {card.title}
        </h3>
        <p className="text-sm leading-relaxed text-white/50">{card.description}</p>

        {card.checkItems && (
          <div
            className="mt-auto space-y-2 pt-6 font-mono text-[0.72rem] leading-relaxed text-[#B4FF00]/80"
            aria-live="polite"
          >
            {card.checkItems.map((item, i) => (
              <p
                key={item}
                className={`transition-opacity duration-500 ${
                  i <= checkIndex ? "opacity-100" : "opacity-30"
                }`}
              >
                {item}
              </p>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

type LandingBentoShowcaseProps = {
  onBentoLongHover: () => void;
  reveal?: boolean;
};

export function LandingBentoShowcase({
  onBentoLongHover,
  reveal = true,
}: LandingBentoShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="studio-showcase"
      className="border-t px-4 py-16 sm:px-10 sm:py-20"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        opacity: reveal && visible ? 1 : 0,
        transform: reveal && visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
      aria-labelledby="bento-showcase-heading"
    >
      <div className="mx-auto w-full max-w-[1160px]">
        <p
          className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--theme-accent)" }}
        >
          Studio Showcase
        </p>
        <h2
          id="bento-showcase-heading"
          className="mb-10 text-center font-display text-[clamp(28px,6vw,48px)] tracking-wide text-white md:mb-12"
        >
          ALLES DRIN.
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BENTO_CARDS.map((card) => (
            <BentoCard
              key={card.id}
              card={card}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onLongHover={onBentoLongHover}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
