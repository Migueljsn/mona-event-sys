export function formatDateForInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isCardExpired(validUntil: string | null) {
  if (!validUntil) {
    return false;
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const validDate = new Date(`${validUntil}T00:00:00.000Z`);

  return validDate < todayUtc;
}

export function getCardStatus(card: {
  is_active: boolean;
  valid_until: string | null;
}) {
  if (isCardExpired(card.valid_until)) {
    return "Expirado";
  }

  return card.is_active ? "Ativo" : "Inativo";
}
