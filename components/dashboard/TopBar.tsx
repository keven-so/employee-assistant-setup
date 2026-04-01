"use client";

import { useSession, signOut } from "next-auth/react";

export function TopBar() {
  const { data: session } = useSession();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const displayName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div
      className="flex items-center justify-between px-5 py-3 rounded-[18px]"
      style={{
        background: "var(--glass-b)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow)",
        animation: "fadeDown 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-[34px] h-[34px] rounded-[12px] flex items-center justify-center text-white text-[13px] font-bold"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #0EA5E9)",
            boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
          }}
        >
          {displayName[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <div className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>
            {greeting}, {displayName}
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
            {today}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt=""
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        {session?.user && (
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="text-[11px] font-medium px-3 py-1.5 rounded-[10px] cursor-pointer transition-all"
            style={{
              color: "var(--text-3)",
              background: "var(--glass)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
