type AiOutputDisclaimerProps = {
  className?: string;
};

export function AiOutputDisclaimer({ className }: AiOutputDisclaimerProps) {
  return (
    <p
      className={className}
      style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.28)",
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
