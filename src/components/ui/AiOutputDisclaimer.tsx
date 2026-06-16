type AiOutputDisclaimerProps = {
  className?: string;
  tone?: "dark" | "light";
};

export function AiOutputDisclaimer({ className, tone = "dark" }: AiOutputDisclaimerProps) {
  return (
    <p
      className={className}
      style={{
        fontSize: 11,
        color: tone === "light" ? "rgba(8,8,8,0.45)" : "rgba(255,255,255,0.28)",
        letterSpacing: "0.02em",
        lineHeight: 1.5,
        marginTop: 8,
      }}
    >
      InfluexAI kann Fehler machen. Bitte überprüfe alle generierten Inhalte vor
      der Verwendung.
    </p>
  );
}
