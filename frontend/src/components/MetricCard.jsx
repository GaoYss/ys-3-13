export function MetricCard({ label, value, tone = 'neutral' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </div>
  )
}
