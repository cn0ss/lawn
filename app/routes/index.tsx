import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: "lawn",
      description: "Open your dashboard.",
      path: "/",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
