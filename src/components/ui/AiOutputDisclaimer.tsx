type AiOutputDisclaimerProps = {
  className?: string;
};

export function AiOutputDisclaimer({ className = "" }: AiOutputDisclaimerProps) {
  return (
    <p className={`mt-4 text-xs text-white/40 ${className}`.trim()}>
      InfluexAI kann Fehler machen. Bitte überprüfe alle generierten Inhalte vor
      der Verwendung.
    </p>
  );
}
