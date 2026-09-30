type IconName = "arrow-up-right" | "arrow-right" | "arrow-left" | "arrow-up" | "arrow-down" | "search" | "play" | "heart" | "history";

export function Icon({ name, filled = false, className = "" }: { name: IconName; filled?: boolean; className?: string }) {
  const shared = {
    className: `ui-icon ui-icon-${name}${className ? ` ${className}` : ""}`,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (name) {
    case "arrow-up-right": return <svg {...shared}><path d="M7 17 17 7M7 7h10v10" /></svg>;
    case "arrow-right": return <svg {...shared}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
    case "arrow-left": return <svg {...shared}><path d="M19 12H5m6-6-6 6 6 6" /></svg>;
    case "arrow-up": return <svg {...shared}><path d="M12 19V5m-6 6 6-6 6 6" /></svg>;
    case "arrow-down": return <svg {...shared}><path d="M12 5v14m6-6-6 6-6-6" /></svg>;
    case "search": return <svg {...shared}><circle cx="10.8" cy="10.8" r="6.4" /><path d="m16 16 4.2 4.2" /></svg>;
    case "play": return <svg {...shared}><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.1 5.7a1.6 1.6 0 0 1 0 2.7l-9.1 5.7c-.7.4-1.6-.1-1.6-.9z" fill="currentColor" stroke="none" /></svg>;
    case "heart": return <svg {...shared}><path d="M20.4 8.8c0 4.2-8.4 10-8.4 10s-8.4-5.8-8.4-10A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.4 2.3Z" fill={filled ? "currentColor" : "none"} /></svg>;
    case "history": return <svg {...shared}><path d="M3.5 12a8.5 8.5 0 1 0 2.3-5.8L3.5 8.5" /><path d="M3.5 4.5v4h4m4.5-1v5l3 1.8" /></svg>;
  }
}
