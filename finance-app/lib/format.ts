const categoryEmojis: Record<string, string> = {
  Alimentação: "🍔",
  "Alimentação Fora": "🍕",
  Restaurante: "🍽️",
  Supermercado: "🛒",
  Transporte: "🚗",
  Combustível: "⛽",
  Estacionamento: "🅿️",
  Casa: "🏠",
  "Água/Luz/Gás": "💡",
  Aluguel: "🏢",
  Condomínio: "🏘️",
  Lazer: "🎮",
  Entretenimento: "🎬",
  Streaming: "📺",
  Viagem: "✈️",
  Saúde: "💊",
  Farmácia: "💊",
  PlanoSaúde: "🏥",
  Educação: "📚",
  Cursos: "📖",
  Escola: "🎒",
  Salário: "💰",
  Freelance: "💻",
  Investimentos: "📈",
  Poupança: "🏦",
  RendaFixa: "📊",
  Transfer: "💸",
  "Transfer - Bank Slip": "📄",
  "Transfer - TED/DOC": "🏧",
  "Transfer - PIX": "💳",
  Pagamento: "💳",
  "Pagamento Conta": "📋",
  "Pagamento - Boleto": "📄",
  Compras: "🛍️",
  Ecommerce: "🛒",
  "Roupas/Calçados": "👕",
  "Beleza/Cuidados": "💄",
  PetShop: "🐾",
  "Telefonia/Internet": "📱",
  Seguros: "🛡️",
  Impostos: "📋",
  Recebimento: "📥",
  "Recebimento - PIX": "💳",
  "Recebimento - TED": "🏧",
  Oficina: "🔧",
  Cartão: "💳",
  "Cartão de Crédito": "💳",
  "Crédito - Pagamento": "💳",
  Serviços: "🔧",
  Assinaturas: "📬",
  Doação: "🎁",
  Outros: "📦",
};

const categoryColors: Record<string, string> = {
  Alimentação: "bg-orange-100 text-orange-700",
  Transporte: "bg-blue-100 text-blue-700",
  Casa: "bg-yellow-100 text-yellow-700",
  Lazer: "bg-purple-100 text-purple-700",
  Saúde: "bg-red-100 text-red-700",
  Educação: "bg-indigo-100 text-indigo-700",
  Salário: "bg-emerald-100 text-emerald-700",
  Investimentos: "bg-cyan-100 text-cyan-700",
  Transfer: "bg-slate-100 text-slate-700",
  Pagamento: "bg-rose-100 text-rose-700",
  Compras: "bg-pink-100 text-pink-700",
  Recebimento: "bg-teal-100 text-teal-700",
};

export function getCategoryEmoji(name: string | null): string {
  if (!name) return "📦";
  return categoryEmojis[name] ?? "📦";
}

export function getCategoryColor(name: string | null): string {
  if (!name) return "bg-slate-100 text-slate-600";
  for (const [prefix, color] of Object.entries(categoryColors)) {
    if (name.startsWith(prefix)) return color;
  }
  return "bg-slate-100 text-slate-600";
}

export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function groupByDate<T extends { date: Date; id: string }>(
  transactions: T[]
): Map<string, T[]> {
  const groups = new Map<string, typeof transactions>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const txn of transactions) {
    const d = new Date(txn.date);
    d.setHours(0, 0, 0, 0);
    let label: string;

    if (d.getTime() === today.getTime()) {
      label = "Hoje";
    } else if (d.getTime() === yesterday.getTime()) {
      label = "Ontem";
    } else {
      label = d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      });
    }

    const list = groups.get(label) ?? [];
    list.push(txn);
    groups.set(label, list);
  }

  return groups;
}
