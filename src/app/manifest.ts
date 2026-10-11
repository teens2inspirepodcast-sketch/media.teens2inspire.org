import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Teens2Inspire", short_name: "Teens2Inspire", description: "The Teens2Inspire media app.", start_url: "/", display: "standalone", background_color: "#090809", theme_color: "#090809", icons: [{ src: "/teens2inspire-favicon.jpg", sizes: "any", type: "image/jpeg" }] };
}
