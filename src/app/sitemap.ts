import type { MetadataRoute } from "next";

export const revalidate = 86_400; // 1 day

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vulnlens.benjaminjost.com";

async function fetchRecentCveIds(): Promise<string[]> {
  const url =
    "https://api.projectdiscovery.io/v2/vulnerability/search?q=(age_in_days:<=180)&fields=doc_id";

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data.results)
    ? data.results
        .map((item: any) => item.doc_id)
        .filter((id: unknown): id is string => typeof id === "string")
    : [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cveIds = await fetchRecentCveIds();

  const cveEntries = cveIds.map((id) => ({
    url: `${baseUrl}/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...cveEntries,
  ];
}
