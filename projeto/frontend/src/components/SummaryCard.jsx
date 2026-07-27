export default function SummaryCard({ label, value, icon: Icon, tone = "neutral" }) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="summary-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
