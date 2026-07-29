const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_ROOT_URL = API_URL.replace(/\/api\/?$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${options.baseUrl || API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detail = "Nao foi possivel carregar os dados.";

    try {
      const payload = await response.json();
      detail = payload.detail || payload.message || detail;
    } catch {
      // Keep the generic message when the backend does not return JSON.
    }

    throw new Error(detail);
  }

  return response.json();
}

export function getDashboard() {
  return request("/dashboard/");
}

export function getAccounts() {
  return request("/accounts/");
}

export function getTransactions() {
  return request("/transactions/");
}

export function createConnectToken(payerCpfCnpj) {
  return request("/openfinance/pluggy/connect-token/", {
    baseUrl: API_ROOT_URL,
    method: "POST",
    body: JSON.stringify({ payer_cpf_cnpj: payerCpfCnpj }),
  });
}

export function createOpenFinanceStatement(payload) {
  return request("/openfinance/extratos/", {
    baseUrl: API_ROOT_URL,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOpenFinanceStatement(uniqueId, payerCpfCnpj) {
  const params = new URLSearchParams({ payer_cpf_cnpj: payerCpfCnpj });

  return request(`/openfinance/extratos/${uniqueId}/?${params.toString()}`, {
    baseUrl: API_ROOT_URL,
  });
}
