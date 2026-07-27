import { formatCurrency } from "../formatters.js";

const chartColors = ["#0f6b5c", "#2f80a7", "#8a5a12", "#8d3f6f", "#4f5d75", "#13733b"];

export default function CategoryChart({ categories }) {
  const total = categories.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <section className="panel category-chart">
      <div className="panel-heading">
        <h2>Gastos por categoria</h2>
      </div>

      {categories.length === 0 ? (
        <div className="empty-chart">Nenhuma despesa registrada.</div>
      ) : (
        <div className="chart-list">
          {categories.map((item, index) => {
            const value = Number(item.total || 0);
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const color = chartColors[index % chartColors.length];

            return (
              <div className="chart-row" key={item.category}>
                <div className="chart-row-label">
                  <span className="chart-dot" style={{ backgroundColor: color }} />
                  <strong>{item.category}</strong>
                  <span>{formatCurrency(value)}</span>
                </div>
                <div className="chart-bar" aria-label={`${item.category}: ${percentage.toFixed(1)}%`}>
                  <span style={{ width: `${percentage}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
