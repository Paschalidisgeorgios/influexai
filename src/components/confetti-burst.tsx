"use client";

export function ConfettiBurst() {
  const colors = ["#B4FF00", "#F0EFE8", "#f59e0b", "#06b6d4", "#ff6b7a"];
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    delay: `${(i % 8) * 0.05}s`,
    color: colors[i % colors.length],
    rotate: `${(i * 37) % 360}deg`,
  }));

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: -12,
            left: p.left,
            width: 8,
            height: 14,
            background: p.color,
            borderRadius: 2,
            animation: `influex-confetti 2.2s ease-out ${p.delay} forwards`,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes influex-confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
