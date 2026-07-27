import { Building2 } from "lucide-react";

import { formatCurrency } from "../formatters.js";

const accountTypeLabels = {
  checking: "Conta corrente",
  savings: "Poupanca",
  credit: "Cartao de credito",
  investment: "Investimento",
};

export default function AccountsList({ accounts }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Contas</h2>
      </div>

      <div className="account-list">
        {accounts.map((account) => (
          <article className="account-item" key={account.id}>
            <div className="account-icon" aria-hidden="true">
              <Building2 size={18} />
            </div>
            <div>
              <strong>{account.name}</strong>
              <span>
                {account.institution} · {accountTypeLabels[account.account_type] || account.account_type}
              </span>
            </div>
            <b className={Number(account.balance) >= 0 ? "positive" : "negative"}>
              {formatCurrency(account.balance)}
            </b>
          </article>
        ))}
      </div>
    </section>
  );
}
