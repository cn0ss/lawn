import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/compare/frameio")({
  head: () =>
    seoHead({
      title: "Compare",
      description: "Open your dashboard.",
      path: "/compare/frameio",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
