import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/mono")({
  head: () =>
    seoHead({
      title: "lawn",
      description: "Open your dashboard.",
      path: "/mono",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
