"use client";

import { useSession, signOut } from "next-auth/react";

export function TopBar() {
  const { data: session } = useSession();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const displayName = session?.user?.name || "there";

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg-card))]">
      <div className="flex items-center gap-5">
        <span className="text-xl font-bold text-[hsl(var(--primary))]">
          Employee Assistant
        </span>
        <span className="text-base text-[hsl(var(--text-secondary))]">
          {greeting}, {displayName} &middot; {today}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="px-3 py-1.5 rounded-full text-sm text-[hsl(var(--text-dim))] hover:text-[hsl(var(--text-secondary))] transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
