type Props = {
  credits: number;
};

export function CreditsDisplay({ credits }: Props) {
  const low = credits < 10;
  return (
    <span
      data-testid="credits-display"
      className={low ? "text-amber-400" : "text-[#B4FF00]"}
      style={{
        fontWeight: 700,
        color: low ? "#fbbf24" : "#B4FF00",
      }}
    >
      {credits}
    </span>
  );
}
