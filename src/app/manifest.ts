import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Teens2Inspire", short_name: "Teens2Inspire",
    description: "Inspiring Jewish teen girls",
    start_url: "/app", scope: "/", display: "standalone",
    background_color: "#10090e", theme_color: "#10090e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
