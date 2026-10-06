import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teens2Inspire | Media",
  description: "Listen, watch, read, discover, and connect with Teens2Inspire.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
