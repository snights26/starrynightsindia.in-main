const DEFAULT_GOOGLE_CLIENT_ID = "465210950971-62qe4rshf9p90etb3gebqmaekglqu9td.apps.googleusercontent.com";

export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== "false";

export const GOOGLE_CLIENT_ID = GOOGLE_AUTH_ENABLED
  ? import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  : "";
