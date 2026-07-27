const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados.");
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
