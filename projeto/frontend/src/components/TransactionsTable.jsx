import { formatCurrency, formatDate } from "../formatters.js";

export default function TransactionsTable({ transactions }) {
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <h2>Transacoes recentes</h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th>Conta</th>
              <th>Categoria</th>
              <th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.description}</td>
                <td>{transaction.account_name}</td>
                <td>{transaction.category || "Sem categoria"}</td>
                <td className={`num ${transaction.transaction_type === "income" ? "positive" : "negative"}`}>
                  {transaction.transaction_type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
