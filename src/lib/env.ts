export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim();

if (!BACKEND_URL) {
  // Keep this as a runtime error so misconfigured env fails fast.
  throw new Error("Missing VITE_BACKEND_URL in environment (.env)");
}

