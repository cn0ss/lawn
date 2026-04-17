import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

if (!convexSiteUrl) {
  throw new Error("Missing VITE_CONVEX_SITE_URL");
}

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()],
});
