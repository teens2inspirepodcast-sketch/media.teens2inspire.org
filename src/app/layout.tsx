import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";
export const metadata: Metadata = { title: { default: "Teens2Inspire — Your media space", template: "%s | Teens2Inspire" }, description: "A thoughtful media library for Jewish teen girls. Watch, listen, read, and save the things that stay with you.", applicationName: "Teens2Inspire", manifest: "/manifest.webmanifest", icons: { icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" } };
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}<PWARegister /></body></html>; }
