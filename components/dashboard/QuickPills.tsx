"use client";

const pills = [
  { icon: "\u{1F4C5}", label: "Calendar", href: "https://calendar.google.com" },
  { icon: "\u2705", label: "Tasks", href: "https://tasks.google.com" },
  { icon: "\u{1F4E8}", label: "Emails", href: "https://mail.google.com" },
  { icon: "\u{1F5DE}", label: "AI News", href: "#news-card" },
];

export function QuickPills() {
  const handlePillClick = (pill: (typeof pills)[number]) => {
    if (pill.label === "AI News") {
      document.getElementById("news-card")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (pill.href) {
      window.open(pill.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex-shrink-0" style={{ animation: "fadeDown 0.45s ease 0.15s both" }}>
      <div className="flex gap-2.5">
        {pills.map((pill) => (
          <button
            key={pill.label}
            onClick={() => handlePillClick(pill)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2.5 rounded-[14px] cursor-pointer transition-all"
            style={{
              background: "var(--glass)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid var(--border)",
              boxShadow: "0 4px 14px rgba(100,130,170,0.10)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.80)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span className="text-xl">{pill.icon}</span>
            <span className="text-[10.5px] font-semibold" style={{ color: "var(--text-2)" }}>
              {pill.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
