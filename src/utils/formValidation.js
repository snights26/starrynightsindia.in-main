export const PHONE_NUMBER_PATTERN = /^\d{10}$/;

export function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function isValidPhoneNumber(value) {
  return PHONE_NUMBER_PATTERN.test(String(value || ""));
}

export function isBlank(value) {
  return !String(value || "").trim();
}
