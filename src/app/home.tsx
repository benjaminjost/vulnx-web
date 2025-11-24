"use client";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  CheckCircle2,
  Filter,
  Info,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { columns } from "../components/cve-columns";
import { DataTable } from "../components/data-table";
import { CVERecord } from "../models/CVERecord";

const sanitizeQueryInput = (value: string) =>
  value
    .replaceAll(/[^\w\s\-.:/"()&|<>=]/g, "")
    .replaceAll(/\s+/g, " ")
    .slice(0, 200);

const sanitizeApiKeyInput = (value: string) =>
  value.replaceAll(/[^A-Za-z0-9\-_.]/g, "").slice(0, 128);

type ThemeMode = "light" | "dark";

export default function MainPage() {
  const [results, setResults] = useState<CVERecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showApiBanner, setShowApiBanner] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [filterInfo, setFilterInfo] = useState<
    Array<{
      field: string;
      description: string;
      examples: string[];
      enum_values?: string[];
    }>
  >([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem("vulnxTheme") as ThemeMode | null;
    const initialTheme = storedTheme ?? (mediaQuery.matches ? "dark" : "light");
    setTheme(initialTheme);

    const handleChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem("vulnxTheme")) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    setMounted(true);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("vulnxTheme", next);
      return next;
    });
  };

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
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch(
        "https://api.projec.tdiscovery.io/v2/vulnerability/filters",
        {
          method: "GET",
          headers: headers,
        },
      );

      if (response.ok) {
        const data = await response.json();
        const filteredData = data
          .filter((item: any) => item.examples && item.examples.length > 0)
          .map((item: any) => ({
            field: item.field,
            description: item.description,
            examples: item.examples,
            enum_values: item.enum_values || undefined,
          }));
        setFilterInfo(filteredData);
        localStorage.setItem("vulnxFilterInfo", JSON.stringify(filteredData));
      }
    } catch (err) {
      console.error("Failed to fetch filter information", err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedQuery = sanitizeQueryInput(query).trim();
    if (!cleanedQuery) return;
    if (cleanedQuery !== query) {
      setQuery(cleanedQuery);
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      let searchQuery = `(${cleanedQuery})`;

      const encodedQuery = encodeURIComponent(searchQuery);
      const apiUrl = `https://api.projectdiscovery.io/v2/vulnerability/search?q=${encodedQuery}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Invalid or missing API key. Please check your API configuration in Settings.",
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Configure an API key in Settings for higher rate limits, or wait a moment and try again.",
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Server error. The API service is temporarily unavailable. Please try again later.",
          );
        } else {
          throw new Error(
            `Search failed (${response.status}). Please check your query.`,
          );
        }
      }

      const data = await response.json();

      if (data && typeof data === "object" && Array.isArray(data.results)) {
        const cveRecords = data.results.map((item: any) => new CVERecord(item));
        setResults(cveRecords);

        if (cveRecords.length === 0) {
          throw new Error("No results found.");
        }
      } else {
        throw new Error("Invalid response format from API.");
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Failed to fetch") {
          setError(
            "Unable to connect to the API. Please check your internet connection and try again.",
          );
        } else {
          setError(err.message);
        }
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              Vulnx
            </h1>
            <Badge variant="secondary" className="text-xs">
              Web
            </Badge>
          </div>
          {mounted && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                role="switch"
                aria-checked={theme === "dark"}
                onClick={toggleTheme}
                className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-1 py-1 text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground/70"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </span>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground/70"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </span>
                <span className="sr-only">Toggle color theme</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          {mounted && (
            <Tabs defaultValue="explore" className="w-full">
              <TabsList className="inline-flex mb-4">
                <TabsTrigger
                  value="explore"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Explore
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
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
                          be rate limited. For better performance, configure
                          your API key in the settings tab.
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
                            className="pl-10"
                            value={query}
                            onChange={(e) =>
                              setQuery(sanitizeQueryInput(e.target.value))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSearch(e)
                            }
                          />
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
                                                onClick={() =>
                                                  setQuery(example)
                                                }
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
                        return (
                          <div className="space-y-4">
                            {/* Description */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                              <h4 className="text-sm font-semibold text-foreground mb-2">
                                Description
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {result.description}
                              </p>
                            </div>

                            {/* Impact & Remediation */}
                            {(result.impact ||
                              result.remediation ||
                              result.requirements) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.impact && (
                                  <div className="bg-card rounded-lg p-4 border border-border">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      Impact
                                    </h4>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {result.impact}
                                    </p>
                                  </div>
                                )}
                                {result.remediation && (
                                  <div className="bg-card rounded-lg p-4 border border-border">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      Remediation
                                    </h4>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {result.remediation}
                                    </p>
                                  </div>
                                )}
                                {result.requirements && (
                                  <div className="bg-card rounded-lg p-4 border border-border md:col-span-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      Requirements
                                    </h4>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {result.requirements}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {result.vendor && (
                                <div className="bg-card rounded-lg p-4 border border-border">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Vendor
                                  </h4>
                                  <p className="text-sm text-foreground font-medium">
                                    {result.vendor}
                                  </p>
                                </div>
                              )}
                              {result.product && (
                                <div className="bg-card rounded-lg p-4 border border-border">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Product
                                  </h4>
                                  <p className="text-sm text-foreground font-medium">
                                    {result.product}
                                  </p>
                                </div>
                              )}
                              {result.vulnerabilityType && (
                                <div className="bg-card rounded-lg p-4 border border-border">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Type
                                  </h4>
                                  <p className="text-sm text-foreground font-medium capitalize">
                                    {result.vulnerabilityType.replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </p>
                                </div>
                              )}
                              {result.publishedAt && (
                                <div className="bg-card rounded-lg p-4 border border-border">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Published
                                  </h4>
                                  <p className="text-sm text-foreground font-medium">
                                    {new Date(
                                      result.publishedAt,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              )}
                              {result.updatedAt && (
                                <div className="bg-card rounded-lg p-4 border border-border">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Updated
                                  </h4>
                                  <p className="text-sm text-foreground font-medium">
                                    {new Date(
                                      result.updatedAt,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Security Attributes */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Patch Available
                                </h4>
                                <p className="text-sm text-foreground font-semibold">
                                  {result.isPatchAvailable ? "✓ Yes" : "✗ No"}
                                </p>
                              </div>
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Attributes
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {result.isExploitSeen && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-status-critical text-status-critical-foreground">
                                      Exploit Seen
                                    </span>
                                  )}
                                  {result.isRemote && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground">
                                      Remote
                                    </span>
                                  )}
                                  {result.isAuth && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-status-high text-status-high-foreground">
                                      Auth
                                    </span>
                                  )}
                                  {result.isTemplate && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-status-low text-status-low-foreground">
                                      Template
                                    </span>
                                  )}
                                  {!result.isExploitSeen &&
                                    !result.isRemote &&
                                    !result.isAuth &&
                                    !result.isTemplate && (
                                      <span className="text-xs text-muted-foreground">
                                        None
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>

                            {result.vector && (
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Attack Vector (CVSS)
                                </h4>
                                <p className="text-sm text-foreground font-mono">
                                  {result.vector}
                                </p>
                              </div>
                            )}

                            {/* Weaknesses */}
                            {result.weaknesses.length > 0 && (
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-2">
                                  Weaknesses (CWE)
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {result.weaknesses.map((weakness, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-status-medium text-status-medium-foreground"
                                    >
                                      {weakness}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* PoC URLs */}
                            {result.pocUrls.length > 0 && (
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  Proof of Concept (PoC)
                                </h4>
                                <ul className="space-y-2">
                                  {result.pocUrls.map((poc, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2"
                                    >
                                      <svg
                                        className="w-4 h-4 text-status-critical mt-0.5 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                      </svg>
                                      <a
                                        href={poc}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:text-primary/80 hover:underline break-all font-medium transition-colors"
                                      >
                                        {poc}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* References */}
                            {result.references.length > 0 && (
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  References
                                </h4>
                                <ul className="space-y-2">
                                  {result.references
                                    .slice(0, 5)
                                    .map((ref, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2"
                                      >
                                        <svg
                                          className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                        <a
                                          href={ref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:text-primary/80 hover:underline break-all font-medium transition-colors"
                                        >
                                          {ref}
                                        </a>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            {/* Nuclei Template URL */}
                            {result.isTemplate && result.uri && (
                              <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  Nuclei Template
                                </h4>
                                <div className="flex items-start gap-2">
                                  <svg
                                    className="w-4 h-4 text-status-low mt-0.5 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                    />
                                  </svg>
                                  <a
                                    href={`https://github.com/projectdiscovery/nuclei-templates/blob/main/${result.uri}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:text-primary/80 hover:underline break-all font-medium transition-colors"
                                  >
                                    {`https://github.com/projectdiscovery/nuclei-templates/blob/main/${result.uri}`}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
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
                      <CardTitle className="text-xl">
                        API Configuration
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Optional: Connect your ProjectDiscovery API key for
                        better performance and higher rate limits
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

                    <Button onClick={handleApiKeySave} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
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
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs sm:text-sm text-muted-foreground">
          <p className="text-xs sm:text-sm">
            Powered by{" "}
            <a
              href="https://github.com/projectdiscovery/cvemap"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary/80 hover:underline"
            >
              ProjectDiscovery Vulnerability API
            </a>
            <span className="mx-1 text-muted-foreground/70">•</span>
            <a
              href="https://github.com/benjaminjost/vulnx-web"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary/80 hover:underline"
            >
              View Source on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
