"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchFilters,
  searchCVE,
  type FilterInfo,
} from "@/lib/projectdiscovery-api";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Info,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { columns } from "../components/cve-columns";
import { CVEDetails } from "../components/cve-details";
import { DataTable } from "../components/data-table";
import Footer from "../components/footer";
import Header from "../components/header";
import { CVERecord } from "../models/CVERecord";

const sanitizeQueryInput = (value: string) =>
  value
    .replaceAll(/[^\w\s\-.:/"()&|<>=]/g, "")
    .replaceAll(/\s+/g, " ")
    .slice(0, 200);

const sanitizeApiKeyInput = (value: string) =>
  value.replaceAll(/[^A-Za-z0-9\-_.]/g, "").slice(0, 128);

export default function MainPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<CVERecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showApiBanner, setShowApiBanner] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [filterInfo, setFilterInfo] = useState<FilterInfo[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) {
      try {
        const decodedQuery = atob(qParam);
        setQuery(sanitizeQueryInput(decodedQuery));
        setTimeout(() => {
          const cleanedQuery = sanitizeQueryInput(decodedQuery).trim();
          if (cleanedQuery) {
            performSearch(cleanedQuery);
          }
        }, 100);
      } catch (e) {
        console.error("Failed to decode query parameter", e);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const storedKey = localStorage.getItem("vulnxApiKey");
    const bannerDismissed = localStorage.getItem("vulnxBannerDismissed");
    const storedFilters = localStorage.getItem("vulnxFilterInfo");

    if (storedKey) {
      setApiKey(sanitizeApiKeyInput(storedKey));
    } else if (!bannerDismissed) {
      setShowApiBanner(true);
    }

    if (storedFilters) {
      try {
        setFilterInfo(JSON.parse(storedFilters));
      } catch (e) {
        console.error("Failed to parse stored filters", e);
        fetchFilterInfo();
      }
    } else {
      fetchFilterInfo();
    }
  }, []);

  const fetchFilterInfo = async () => {
    setLoadingFilters(true);

    const result = await fetchFilters();

    if (result.success && result.data) {
      setFilterInfo(result.data);
      localStorage.setItem("vulnxFilterInfo", JSON.stringify(result.data));
    } else if (result.error) {
      console.error("Failed to fetch filter information", result.error);
    }

    setLoadingFilters(false);
  };

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    setResults([]);

    const result = await searchCVE({
      query: searchQuery,
    });

    if (result.success && result.data) {
      setResults(result.data);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedQuery = sanitizeQueryInput(query).trim();
    if (!cleanedQuery) return;
    if (cleanedQuery !== query) {
      setQuery(cleanedQuery);
    }

    const encodedQuery = btoa(cleanedQuery);
    router.push(`/?q=${encodedQuery}`);

    await performSearch(cleanedQuery);
  };

  const handleApiKeySave = () => {
    const cleanedKey = sanitizeApiKeyInput(apiKey).trim();
    if (cleanedKey) {
      if (cleanedKey !== apiKey) {
        setApiKey(cleanedKey);
      }
      localStorage.setItem("vulnxApiKey", cleanedKey);
      setShowApiBanner(false);
      setApiKeySaved(true);

      setTimeout(() => {
        setApiKeySaved(false);
      }, 3000);
    }
  };

  const handleApiKeyDelete = () => {
    localStorage.removeItem("vulnxApiKey");
    setApiKey("");
    setApiKeySaved(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <Tabs defaultValue="explore" className="w-full">
            <TabsList className="inline-flex mb-4">
              <TabsTrigger value="explore" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Explore
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Explore Tab */}
            <TabsContent value="explore" className="space-y-6">
              {/* API Key Info Banner */}
              {showApiBanner && (
                <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Info className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-sm text-foreground">
                        You can use this search without an API key, but you'll
                        be rate limited. For better performance, configure your
                        API key in the settings tab.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                      onClick={() => {
                        setShowApiBanner(false);
                        localStorage.setItem("vulnxBannerDismissed", "true");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Search Section */}
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="searchInput"
                          type="text"
                          placeholder="Search vulnerabilities by product, vendor, CVE ID..."
                          className="pl-10 pr-10"
                          value={query}
                          onChange={(e) =>
                            setQuery(sanitizeQueryInput(e.target.value))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSearch(e)
                          }
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <Info className="h-4 w-4" />
                          Query Info
                        </Button>

                        <Button
                          onClick={handleSearch}
                          disabled={loading || !query.trim()}
                          className="min-w-[100px]"
                        >
                          <Search className="h-4 w-4" />
                          {loading ? "Searching..." : "Search"}
                        </Button>
                      </div>
                    </div>

                    {/* Query Info Panel */}
                    {showFilters && (
                      <div className="rounded-lg border border-border bg-secondary p-4">
                        <div className="mb-4 flex items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground mb-1">
                              Query Filters & Syntax
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Combine filters with{" "}
                              <code className="px-1 py-0.5 rounded bg-card border border-border font-mono text-xs">
                                &&
                              </code>{" "}
                              (AND) or{" "}
                              <code className="px-1 py-0.5 rounded bg-card border border-border font-mono text-xs">
                                ||
                              </code>{" "}
                              (OR)
                            </p>
                          </div>
                          <div className="w-64">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search filters..."
                                className="pl-10 h-9"
                                value={filterSearchTerm}
                                onChange={(e) =>
                                  setFilterSearchTerm(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {loadingFilters ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {filterInfo.filter((filter) => {
                              if (!filterSearchTerm.trim()) return true;
                              const searchLower =
                                filterSearchTerm.toLowerCase();
                              return (
                                filter.field
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                filter.description
                                  .toLowerCase()
                                  .includes(searchLower)
                              );
                            }).length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">
                                  No filters match &quot;{filterSearchTerm}
                                  &quot;
                                </p>
                              </div>
                            ) : (
                              filterInfo
                                .filter((filter) => {
                                  if (!filterSearchTerm.trim()) return true;
                                  const searchLower =
                                    filterSearchTerm.toLowerCase();
                                  return (
                                    filter.field
                                      .toLowerCase()
                                      .includes(searchLower) ||
                                    filter.description
                                      .toLowerCase()
                                      .includes(searchLower)
                                  );
                                })
                                .map((filter, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-lg border border-border bg-card p-3 shadow-sm"
                                  >
                                    <div className="mb-2">
                                      <code className="text-sm font-semibold text-primary">
                                        {filter.field}
                                      </code>
                                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        {filter.description}
                                      </p>
                                    </div>

                                    {filter.enum_values &&
                                      filter.enum_values.length > 0 && (
                                        <div className="mb-2">
                                          <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                            Allowed values:
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {filter.enum_values.map(
                                              (enumVal, enumIdx) => (
                                                <span
                                                  key={enumIdx}
                                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-foreground font-mono border border-border"
                                                >
                                                  {enumVal}
                                                </span>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                        Examples:
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {filter.examples.map(
                                          (example, exIdx) => (
                                            <button
                                              key={exIdx}
                                              onClick={() => setQuery(example)}
                                              className="inline-flex items-center px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors"
                                            >
                                              {example}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results Table */}
              <div className="flex flex-col gap-6">
                {loading && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">
                          Loading results...
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
                {!loading && !error && results.length === 0 && (
                  <Card className="border-border">
                    <CardContent className="py-16">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="rounded-full bg-secondary p-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            No results found
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Try searching for a vulnerability using different
                            keywords
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!loading && !error && results.length > 0 && (
                  <DataTable
                    columns={columns}
                    data={results}
                    renderSubComponent={({ row }) => {
                      const result = row.original as CVERecord;
                      return <CVEDetails cve={result} />;
                    }}
                  />
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl">API Configuration</CardTitle>
                    <CardDescription className="text-sm">
                      Optional: Connect your ProjectDiscovery API key for better
                      performance and higher rate limits
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <label
                      htmlFor="apiKeyInput"
                      className="text-sm font-semibold text-foreground"
                    >
                      API Key
                    </label>
                    <Input
                      id="apiKeyInput"
                      type="password"
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={apiKey}
                      onChange={(e) =>
                        setApiKey(sanitizeApiKeyInput(e.target.value))
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://cloud.projectdiscovery.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                      >
                        ProjectDiscovery Cloud
                      </a>{" "}
                      to avoid rate limits and get better performance.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary p-4">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Your data is secure
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your API key is stored locally in your browser and is
                        never transmitted to our servers. All API requests are
                        made directly to ProjectDiscovery.
                      </p>
                    </div>
                  </div>

                  {apiKeySaved && (
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-status-low/40 bg-status-low/10">
                      <CheckCircle2 className="h-5 w-5 text-status-low" />
                      <p className="text-sm font-medium text-status-low">
                        API key saved successfully!
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleApiKeySave} className="flex-1">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                    {apiKey && (
                      <Button
                        onClick={handleApiKeyDelete}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Query Filters Management */}
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl">Query Filters</CardTitle>
                    <CardDescription className="text-sm">
                      Manage available query filters and syntax information
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary p-4">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Filter information cached locally
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Query filters are fetched from the API and stored in
                        your browser for quick access. Click refresh to update
                        with the latest filters.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={fetchFilterInfo}
                    disabled={loadingFilters}
                    variant="outline"
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {loadingFilters ? "Refreshing..." : "Refresh Filter List"}
                  </Button>

                  {filterInfo.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {filterInfo.length} filters available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
