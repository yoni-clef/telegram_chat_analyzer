export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-ink/70">{title}</div>
      {children}
    </div>
  );
}
