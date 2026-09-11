// The validate_reservation() trigger already raises exceptions with friendly
// Portuguese messages (e.g. "A mesa comporta no máximo 4 pessoas"), so most of
// the time we can show error.message directly. This helper only steps in for
// the rare cases where Postgres/PostgREST returns something more generic
// (constraint names, RLS wording, etc.) instead of our own RAISE EXCEPTION text.
export function friendlyReservationError(raw: string | null | undefined): string {
  const message = (raw || "").trim();
  if (!message) return "Não foi possível salvar a reserva. Tente novamente.";

  // Our own trigger messages are already human-readable PT-BR — pass through.
  const knownPrefixes = [
    "A mesa comporta",
    "Esta mesa exige",
    "Não há mesa",
    "O restaurante não aceita",
    "Já existe uma reserva",
    "Número de pessoas inválido",
    "Mesa não encontrada",
  ];
  if (knownPrefixes.some((p) => message.startsWith(p))) return message;

  if (/row-level security/i.test(message)) {
    return "Você não tem permissão para fazer essa alteração.";
  }
  if (/duplicate key/i.test(message) && /restaurant_closures/i.test(message)) {
    return "Esse dia já está marcado como fechado.";
  }
  if (/violates foreign key/i.test(message)) {
    return "Um dos dados selecionados não é mais válido — atualize a página e tente de novo.";
  }
  if (/violates not-null constraint/i.test(message)) {
    return "Preencha todos os campos obrigatórios.";
  }

  // Fall back to the raw message rather than hiding it — better than a silent failure.
  return message;
}
