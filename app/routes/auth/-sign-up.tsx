import { useRouterState } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

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

export default function SignUpPage() {
  const search = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const redirectUrl = new URLSearchParams(search).get("redirect_url");
  const inviteToken = getInviteToken(redirectUrl);
  const authSettings = useQuery(api.auth.getAuthSettings, {});
  const invite = useQuery(
    api.teams.getInviteByToken,
    inviteToken ? { token: inviteToken } : "skip",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invite?.email) {
      setEmail(invite.email);
    }
  }, [invite?.email]);

  if (inviteToken && invite === undefined) {
    return (
      <Card className="bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono">
            Loading invite
          </CardTitle>
          <CardDescription className="text-[#888] font-mono">
            Checking your invitation before account creation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (inviteToken && invite === null) {
    return (
      <Card className="bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono">
            Invite invalid
          </CardTitle>
          <CardDescription className="text-[#888] font-mono">
            This invite is invalid or expired. Ask for a fresh invite before creating an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/sign-in" className="inline-flex w-full">
            <Button className="w-full">Go to sign in</Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  if (authSettings?.signupsEnabled === false && !inviteToken) {
    return (
      <Card className="bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <CardHeader>
          <CardTitle className="text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono">
            Sign-up disabled
          </CardTitle>
          <CardDescription className="text-[#888] font-mono">
            New account creation is currently turned off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={
              redirectUrl
                ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
                : "/sign-in"
            }
            className="inline-flex w-full"
          >
            <Button className="w-full">Go to sign in</Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const signUpEmail = authClient.signUp.email as (payload: Record<string, unknown>) => Promise<{
        error?: { message?: string };
      }>;
      const result = await signUpEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteToken: inviteToken ?? undefined,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to create account.");
        return;
      }

      window.location.replace(redirectUrl || "/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]">
      <CardHeader>
        <CardTitle className="text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono">
          {inviteToken ? "Create account to accept invite" : "Create account"}
        </CardTitle>
        <CardDescription className="text-[#888] font-mono">
          {inviteToken
            ? "Use the invited email address so you can join the team immediately."
            : "Start using lawn without an external auth provider."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            autoComplete="name"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="bg-transparent border-2 border-[#1a1a1a] rounded-none font-mono"
          />
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={Boolean(inviteToken)}
            className="bg-transparent border-2 border-[#1a1a1a] rounded-none font-mono"
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="bg-transparent border-2 border-[#1a1a1a] rounded-none font-mono"
          />
          {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
          <Button
            type="submit"
            className="w-full bg-[#1a1a1a] hover:bg-[#2d5a2d] text-[#f0f0e8] rounded-none font-mono font-bold uppercase"
            disabled={!name.trim() || !email.trim() || !password.trim() || isSubmitting}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[#888] font-mono">
          Already have an account?{" "}
          <a
            href={
              redirectUrl
                ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
                : "/sign-in"
            }
            className="text-[#2d5a2d] hover:text-[#1a1a1a] font-bold"
          >
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
