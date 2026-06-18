import Link from "next/link";
import type { ReactNode } from "react";
import { LegalShell } from "@/components/shared/influex";

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="influex-legal-link">
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
      className="influex-legal-link"
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
  return <LegalShell title={title}>{children}</LegalShell>;
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="influex-legal-section">
      <h2 className="influex-legal-section__title">{title}</h2>
      <div className="influex-legal-section__body">{children}</div>
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
    <p className={muted ? "influex-legal-paragraph influex-legal-paragraph--muted" : "influex-legal-paragraph"}>
      {children}
    </p>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="influex-legal-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
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
    <nav className={`influex-legal-footer-nav ${className}`.trim()} aria-label="Rechtliches">
      {LEGAL_FOOTER_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="influex-legal-footer-nav__link">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
