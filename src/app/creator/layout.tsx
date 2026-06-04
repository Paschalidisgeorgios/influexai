export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ minHeight: "100vh", background: "#060608", color: "#F0EFE8" }}
    >
      {children}
    </div>
  );
}
