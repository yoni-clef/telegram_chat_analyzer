interface KpiCardProps {
  label: string;
  value: string | number;
}

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-ink/50">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
