/** Tabler-style spy (ti-spy) */
export function TablerSpy({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M14.105 3.105a6.5 6.5 0 0 1 0 9.79" />
      <path d="M9.895 3.105a6.5 6.5 0 0 0 0 9.79" />
      <path d="M13 13a3 3 0 0 1 -3 3" />
      <path d="M3 17v-6a9 9 0 0 1 18 0v6" />
      <path d="M8 17l1 .5a4 4 0 0 0 6 0l1 -.5" />
    </svg>
  );
}
