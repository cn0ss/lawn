import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { createAuthMiddleware } from "@better-auth/core/api";
import { APIError } from "@better-auth/core/error";
import { betterAuth } from "better-auth/minimal";
import { v } from "convex/values";

import authConfig from "./auth.config";
import { components, internal } from "./_generated/api";
import { query, internalQuery, QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";

type AuthIdentity = NonNullable<
  Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
>;

const defaultSiteUrl = "http://localhost:5296";

export const authComponent = createClient<DataModel>(components.betterAuth);

function areSignupsEnabled() {
  return process.env.ALLOW_SIGNUPS !== "false";
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

async function requireValidInviteSignup(
  ctx: QueryCtx | MutationCtx,
  inviteToken: string,
  email: string,
) {
  const invite = await ctx.db
    .query("teamInvites")
    .withIndex("by_token", (q) => q.eq("token", inviteToken))
    .unique();

  if (!invite || invite.expiresAt < Date.now()) {
    throw APIError.from("BAD_REQUEST", {
      message: "A valid invite is required to create an account.",
      code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
    });
  }

  if (invite.email !== normalizedEmail(email)) {
    throw APIError.from("BAD_REQUEST", {
      message: "Use the invited email address to create this account.",
      code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
    });
  }
}

export const validateInviteSignup = internalQuery({
  args: {
    inviteToken: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireValidInviteSignup(ctx, args.inviteToken, args.email);
    return { ok: true };
  },
});

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL ?? defaultSiteUrl;
  const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.VITE_CONVEX_SITE_URL;

  return betterAuth({
    baseURL: authBaseUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    hooks: {
      before: createAuthMiddleware(async (hookContext) => {
        if (hookContext.path !== "/sign-up/email" || areSignupsEnabled()) {
          return;
        }

        const body =
          hookContext.body && typeof hookContext.body === "object"
            ? (hookContext.body as Record<string, unknown>)
            : {};
        const inviteToken =
          typeof body.inviteToken === "string" ? body.inviteToken : undefined;
        const email = typeof body.email === "string" ? body.email : "";

        if (!inviteToken) {
          throw APIError.from("BAD_REQUEST", {
            message: "Sign up is disabled unless you were invited.",
            code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
          });
        }

        await ctx.runQuery(internal.auth.validateInviteSignup, {
          inviteToken,
          email,
        });
      }),
    },
    plugins: [
      crossDomain({ siteUrl }),
      convex({
        authConfig,
        jwt: {
          definePayload: ({ user }) => ({
            name: user.name,
            email: user.email,
            pictureUrl: user.image,
          }),
        },
      }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});

export const getAuthSettings = query({
  args: {},
  handler: async () => {
    return {
      signupsEnabled: areSignupsEnabled(),
    };
  },
});

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function getOptionalString(identity: AuthIdentity, key: string): string | undefined {
  const value = (identity as Record<string, unknown>)[key];
  return hasString(value) ? value : undefined;
}

export function identityName(identity: AuthIdentity): string {
  const name = getOptionalString(identity, "name");
  if (name) return name;

  const firstName = getOptionalString(identity, "firstName");
  const lastName = getOptionalString(identity, "lastName");
  if (firstName && lastName) return `${firstName} ${lastName}`;

  const email = getOptionalString(identity, "email");
  if (email) return email;

  return "Unknown";
}

export function identityEmail(identity: AuthIdentity): string {
  return getOptionalString(identity, "email") ?? "";
}

export function identityAvatarUrl(identity: AuthIdentity): string | undefined {
  return getOptionalString(identity, "pictureUrl") ?? getOptionalString(identity, "image");
}

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return identity;
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function getIdentity(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

export async function requireTeamAccess(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userClerkId", user.subject)
    )
    .unique();

  if (!membership) {
    throw new Error("Not a team member");
  }

  if (requiredRole && ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[requiredRole]) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }

  return { user, membership };
}

export async function requireProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const { membership } = await requireTeamAccess(ctx, project.teamId, requiredRole);

  return { user, membership, project };
}

export async function requireVideoAccess(
  ctx: QueryCtx | MutationCtx,
  videoId: Id<"videos">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const video = await ctx.db.get(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  const { membership, project } = await requireProjectAccess(ctx, video.projectId, requiredRole);

  return { user, membership, project, video };
}
