"use client";

import { CVEDetails } from "@/components/cve-details";
import { CVEHeader } from "@/components/cve-header";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { searchCVE } from "@/lib/projectdiscovery-api";
import { CVERecord } from "@/models/CVERecord";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function CVEDetailPage({
  params,
}: {
  params: Promise<{ cveId: string }>;
}) {
  const [cveId, setCveId] = useState<string>("");
  const [cveData, setCveData] = useState<CVERecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setCveId(p.cveId);
      fetchCVEData(p.cveId);
    });
  }, [params]);

  useEffect(() => {
    if (cveData) {
      document.title = `${cveData.cveId} - ${cveData.name || "CVE Details"} | Vulnx`;
    } else if (cveId) {
      document.title = `${cveId} | Vulnx`;
    }
  }, [cveData, cveId]);

  const isValidCveId = (id: string): boolean => {
    const cveRegex = /^CVE-\d{4}-\d{4,}$/i;
    return cveRegex.test(id);
  };

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

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          {loading && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading CVE data...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && !loading && (
            <Card className="border-status-critical/40 bg-status-critical/10">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="h-8 w-8 text-status-critical" />
                  <p className="text-sm font-medium text-status-critical">
                    Error: {error}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && cveData && (
            <div className="space-y-6">
              {/* Header Card with CVE ID and Basic Info */}
              <CVEHeader cve={cveData} />

              {/* CVE Details */}
              <CVEDetails cve={cveData} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
