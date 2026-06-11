import Link from "next/link";
import type { ReactNode } from "react";

const linkStyle = {
  color: "#B4FF00",
  textDecoration: "none",
} as const;

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} style={linkStyle} className="hover:underline">
      {children}
    </Link>
  );
}

export function LegalExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      style={linkStyle}
      className="hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060608",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
      }}
    >
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 32,
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            textDecoration: "none",
          }}
          className="hover:text-[#B4FF00]"
        >
          ← InfluexAI
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            letterSpacing: "0.04em",
            color: "#B4FF00",
            marginBottom: 32,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginTop: 32 }}>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 24,
        }}
      />
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#B4FF00",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function LegalParagraph({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      style={{
        marginBottom: 12,
        ...(muted ? { color: "rgba(255,255,255,0.55)" } : {}),
      }}
    >
      {children}
    </p>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 12px 1.1rem", padding: 0 }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export const LEGAL_FOOTER_LINKS = [
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/impressum", label: "Impressum" },
  { href: "/agb", label: "AGB" },
  { href: "/widerruf", label: "Widerruf" },
  { href: "/faq", label: "FAQ" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
        padding: "16px 24px 24px",
      }}
      aria-label="Rechtliches"
    >
      {LEGAL_FOOTER_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            textDecoration: "none",
          }}
          className="hover:text-[#B4FF00] hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
