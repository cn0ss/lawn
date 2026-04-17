import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seoHead({
      title: "Pricing",
      description: "Open your dashboard.",
      path: "/pricing",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
