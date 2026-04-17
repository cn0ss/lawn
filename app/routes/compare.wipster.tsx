import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/compare/wipster")({
  head: () =>
    seoHead({
      title: "Compare",
      description: "Open your dashboard.",
      path: "/compare/wipster",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
