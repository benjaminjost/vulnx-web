"use client";

import { CVEDetails } from "@/components/cve-details";
import { CVEHeader } from "@/components/cve-header";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchCVE } from "@/lib/projectdiscovery-api";
import { isValidCveId } from "@/lib/utils";
import { CVERecord } from "@/models/CVERecord";
import ErrorBanner from "@/components/error-banner";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ClientCvePage({
  params,
}: {
  params: { cveId: string };
}) {
  const [cveId, setCveId] = useState<string>(params.cveId);
  const [cveData, setCveData] = useState<CVERecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCveId(params.cveId);
    fetchCVEData(params.cveId);
  }, [params.cveId]);

  useEffect(() => {
    if (cveData) {
      document.title = `${cveData.cveId} - ${cveData.name || "CVE Details"} | VulnLens`;
    } else if (cveId) {
      document.title = `${cveId} | VulnLens`;
    }
  }, [cveData, cveId]);

  const fetchCVEData = async (id: string) => {
    setLoading(true);
    setError(null);

    if (!isValidCveId(id)) {
      setError(`Invalid CVE ID format: ${id}. Expected format: CVE-YYYY-NNNNN`);
      setLoading(false);
      return;
    }

    const result = await searchCVE({
      query: id,
    });

    if (result.success && result.data && result.data.length > 0) {
      setCveData(result.data[0]);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{cveId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          {loading && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-64" />
                      <Skeleton className="h-7 w-96" />
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border space-y-2">
                  <Skeleton className="h-5 w-28 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="bg-card rounded-lg p-4 border border-border space-y-2">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          )}

          {error && !loading && <ErrorBanner title="Error" message={error} />}

          {!loading && !error && cveData && (
            <div className="space-y-6">
              <CVEHeader cve={cveData} />

              <CVEDetails cve={cveData} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
