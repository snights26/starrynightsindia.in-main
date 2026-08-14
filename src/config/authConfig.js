export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== "false";

export const GOOGLE_CLIENT_ID = GOOGLE_AUTH_ENABLED
  ? import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
  : "";
