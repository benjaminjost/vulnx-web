import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientCvePage from "./client-page";
import { isValidCveId } from "@/lib/utils";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vulnlens.benjaminjost.com";

export async function generateMetadata(props: {
  params: Promise<{ cveId: string }>;
}): Promise<Metadata> {
  const { cveId } = await props.params;

  if (!isValidCveId(cveId)) {
    return {
      title: "Not Found | VulnLens",
      description: "The requested page was not found.",
    };
  }

  const canonical = `${baseUrl}/${cveId}`;
  const title = `${cveId} | VulnLens`;
  const description = `${cveId} vulnerability details including severity scores, security patches, and exploit information.`;

  return {
    title,
    description,
    alternates: { canonical },
  };
}

export default async function Page(props: {
  params: Promise<{ cveId: string }>;
}) {
  const params = await props.params;

  if (!isValidCveId(params.cveId)) {
    notFound();
  }

  return <ClientCvePage params={params} />;
}
