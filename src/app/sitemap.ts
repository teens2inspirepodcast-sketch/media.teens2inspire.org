import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/listen", "/watch", "/read", "/resources", "/picks", "/events", "/search", "/login"].map((path) => ({ url: `https://media.teens2inspire.com${path}`, lastModified: new Date() })); }
