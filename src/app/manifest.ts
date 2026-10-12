import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Teens2Inspire", short_name: "Teens2Inspire", description: "Inspiring Jewish teen girls", start_url: "/app", display: "standalone", background_color: "#ffffff", theme_color: "#ffffff", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] }; }
