import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/for/video-editors")({
  head: () =>
    seoHead({
      title: "For Video Editors",
      description: "Open your dashboard.",
      path: "/for/video-editors",
      noIndex: true,
    }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
