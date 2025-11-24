import type { MetadataRoute } from "next";

const baseUrl = "https://vulnx.benjaminjost.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
