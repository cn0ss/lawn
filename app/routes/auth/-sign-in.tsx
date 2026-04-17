import { useRouterState } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";

import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";

function getInviteToken(redirectUrl: string | null) {
  if (!redirectUrl) return null;

  const match = redirectUrl.match(/^\/invite\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export default function SignInPage() {
  const search = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const redirectUrl = new URLSearchParams(search).get("redirect_url");
  const inviteToken = getInviteToken(redirectUrl);
  const authSettings = useQuery(api.auth.getAuthSettings, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in.");
        return;
      }

      window.location.replace(redirectUrl || "/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]">
      <CardHeader>
        <CardTitle className="text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono">
          Sign in
        </CardTitle>
        <CardDescription className="text-[#888] font-mono">
          Access your video review workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bg-transparent border-2 border-[#1a1a1a] rounded-none font-mono"
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="bg-transparent border-2 border-[#1a1a1a] rounded-none font-mono"
          />
          {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
          <Button
            type="submit"
            className="w-full bg-[#1a1a1a] hover:bg-[#2d5a2d] text-[#f0f0e8] rounded-none font-mono font-bold uppercase"
            disabled={!email.trim() || !password.trim() || isSubmitting}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        {authSettings?.signupsEnabled !== false || inviteToken ? (
          <p className="mt-4 text-sm text-[#888] font-mono">
            No account yet?{" "}
            <a
              href={
                redirectUrl
                  ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
                  : "/sign-up"
              }
              className="text-[#2d5a2d] hover:text-[#1a1a1a] font-bold"
            >
              Create one
            </a>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
