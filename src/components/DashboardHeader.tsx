import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeToggle";
import React, { useMemo, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmDashboardIndex } from "../../app/routes/dashboard/-index.data";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ThemeToggleButton() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#e8e8e0] transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (⌘⇧L)`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

function UserMenu() {
  const currentUser = useQuery(api.auth.getCurrentUser, {});
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initials = useMemo(() => {
    const value = currentUser?.name || currentUser?.email || "U";
    return value
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser?.email, currentUser?.name]);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await authClient.signOut();
      window.location.replace("/sign-in");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-[#f0f0e8] text-[11px] font-black text-[#1a1a1a]"
          aria-label="Open account menu"
        >
          {currentUser?.image ? (
            <img
              src={currentUser.image}
              alt={currentUser.name ?? currentUser.email}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <div className="px-3 py-2 border-b border-[#1a1a1a]/10">
          <div className="text-sm font-bold text-[#1a1a1a]">
            {currentUser?.name || "Account"}
          </div>
          <div className="text-xs text-[#888] truncate">
            {currentUser?.email || "Signed in"}
          </div>
        </div>
        <DropdownMenuItem onSelect={() => void handleSignOut()} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PathSegment = {
  label: React.ReactNode;
  href?: string;
  prewarmIntentHandlers?: ReturnType<typeof useRoutePrewarmIntent>;
};

export function DashboardHeader({
  children,
  paths = [],
}: {
  children?: React.ReactNode;
  paths?: PathSegment[];
}) {
  const convex = useConvex();
  const prewarmHomeIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmDashboardIndex(convex),
  );

  return (
    <header className="flex-shrink-0 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6">
      <div className="flex items-center text-xl font-black tracking-tighter text-[#1a1a1a] min-w-0 h-11 sm:h-14">
        <Link
          to="/dashboard"
          preload="intent"
          className="hover:text-[#2d5a2d] transition-colors mr-2 flex-shrink-0"
          {...prewarmHomeIntentHandlers}
        >
          lawn.
        </Link>
        {paths.map((path, index) => {
          const isIntermediate = paths.length >= 2 && index < paths.length - 1;

          return (
            <div
              key={index}
              className={`${isIntermediate ? "hidden sm:flex" : "flex"} items-center min-w-0 flex-shrink`}
            >
              <span className="text-[#888] mr-2 flex-shrink-0">/</span>
              {path.href ? (
                <Link
                  to={path.href}
                  preload="intent"
                  className="hover:text-[#2d5a2d] transition-colors truncate mr-2"
                  {...path.prewarmIntentHandlers}
                >
                  {path.label}
                </Link>
              ) : (
                <div className="truncate flex items-center gap-3">
                  {path.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="row-start-1 col-start-2 sm:col-start-3 flex items-center gap-4 pl-4 border-l-2 border-[#1a1a1a]/10 h-8">
        <ThemeToggleButton />
        <UserMenu />
      </div>

      {children && (
        <div className="col-span-full pb-2 sm:pb-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center gap-2 sm:gap-3 sm:justify-end sm:h-14 sm:pl-4 min-w-0">
          {children}
        </div>
      )}
    </header>
  );
}
