import Link from "next/link";

/** Core legal routes — surfaced early for compliance checks and user access. */
const COMPLIANCE_LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export function SiteLegalComplianceNav() {
  return (
    <nav className="site-legal-compliance-nav" aria-label="Rechtliches">
      {COMPLIANCE_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="site-legal-compliance-nav__link">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
