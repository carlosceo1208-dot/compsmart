/** Os 27 estados brasileiros (sigla → nome). */
export const UFS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso",
  MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

/** "Cidade – UF", só a cidade, só a UF ou "—". Usar em qualquer card de vaga (inclusive portal público). */
export const formatLocal = (cidade?: string | null, uf?: string | null) => {
  const c = cidade?.trim(); const u = uf?.trim();
  if (c && u) return `${c} – ${u}`;
  return c || u || "—";
};
