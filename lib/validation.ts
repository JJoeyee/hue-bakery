export const MALAYSIAN_PHONE_PATTERN = /^\+601\d-\d{7,8}$/;
export const MALAYSIAN_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"] as const;

export function formatMalaysiaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  let local = digits.startsWith("60") ? digits.slice(2) : digits;
  if (local.startsWith("0")) local = local.slice(1);
  local = local.slice(0, 10);
  if (!local) return "+60";
  return `+60${local.slice(0, 2)}${local.length > 2 ? `-${local.slice(2)}` : ""}`;
}

export function isValidMalaysiaPhone(value: string) {
  return MALAYSIAN_PHONE_PATTERN.test(value);
}
