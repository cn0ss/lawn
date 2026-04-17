import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/for/agencies")({
  head: () =>
    seoHead({
      title: "For Agencies",
      description: "Open your dashboard.",
      path: "/for/agencies",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
