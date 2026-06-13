// ---------------------------------------------------------------------------
//  StatCard — statistika kartochkasi (admin/owner panellarida)
// ---------------------------------------------------------------------------
export default function StatCard({ label, value, hint, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTopColor: accent } : undefined}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
