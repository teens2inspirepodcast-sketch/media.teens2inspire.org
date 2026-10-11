import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Teens2Inspire | Inspiring Jewish teen girls", description: "A thoughtful media and community space created to inspire Jewish teen girls.", icons: { icon: "/teens2inspire-favicon.jpg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
