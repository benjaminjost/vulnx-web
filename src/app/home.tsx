"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchFilters,
  searchCVE,
  type FilterInfo,
} from "@/lib/projectdiscovery-api";
import {
  AlertCircle,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Filter,
  Info,
  Pencil,
  Search,
  Settings,
  Star,
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

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  createdAt: number;
}

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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editingQueryName, setEditingQueryName] = useState("");
  const [editingQueryText, setEditingQueryText] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogQueryName, setSaveDialogQueryName] = useState("");
  const [saveDialogQueryText, setSaveDialogQueryText] = useState("");

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
    const storedHistory = localStorage.getItem("vulnxSearchHistory");
    const storedSavedQueries = localStorage.getItem("vulnxSavedQueries");

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

    if (storedHistory) {
      try {
        setSearchHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }

    if (storedSavedQueries) {
      try {
        setSavedQueries(JSON.parse(storedSavedQueries));
      } catch (e) {
        console.error("Failed to parse saved queries", e);
      }
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

  const addToSearchHistory = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, 10);
      localStorage.setItem("vulnxSearchHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromSearchHistory = (historyItem: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== historyItem);
      localStorage.setItem("vulnxSearchHistory", JSON.stringify(updated));
      return updated;
    });
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

    addToSearchHistory(cleanedQuery);
    setShowHistory(false);
    setHistoryIndex(-1);

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

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showHistory && searchHistory.length > 0) {
        setShowHistory(true);
        setHistoryIndex(0);
      } else if (historyIndex < searchHistory.length - 1) {
        setHistoryIndex(historyIndex + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
      }
    } else if (e.key === "Enter") {
      if (historyIndex >= 0 && searchHistory[historyIndex]) {
        e.preventDefault();
        setQuery(searchHistory[historyIndex]);
        setShowHistory(false);
        setHistoryIndex(-1);
        setTimeout(() => {
          const cleanedQuery = sanitizeQueryInput(searchHistory[historyIndex]).trim();
          if (cleanedQuery) {
            const encodedQuery = btoa(cleanedQuery);
            router.push(`/?q=${encodedQuery}`);
            performSearch(cleanedQuery);
          }
        }, 0);
      } else {
        handleSearch(e);
      }
    } else if (e.key === "Escape") {
      setShowHistory(false);
      setHistoryIndex(-1);
    }
  };

  const handleHistoryItemClick = (historyItem: string) => {
    setQuery(historyItem);
    setShowHistory(false);
    setHistoryIndex(-1);
    const cleanedQuery = sanitizeQueryInput(historyItem).trim();
    if (cleanedQuery) {
      const encodedQuery = btoa(cleanedQuery);
      router.push(`/?q=${encodedQuery}`);
      performSearch(cleanedQuery);
    }
  };

  const handleFillSearchInput = (historyItem: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery(historyItem);
    setShowHistory(false);
    setHistoryIndex(-1);
    searchInputRef.current?.focus();
  };

  const saveQuery = (name: string, queryText: string) => {
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: name.trim(),
      query: queryText.trim(),
      createdAt: Date.now(),
    };

    setSavedQueries((prev) => {
      const updated = [...prev, newQuery];
      localStorage.setItem("vulnxSavedQueries", JSON.stringify(updated));
      return updated;
    });
  };

  const updateSavedQuery = (id: string, name: string, queryText: string) => {
    setSavedQueries((prev) => {
      const updated = prev.map((q) =>
        q.id === id
          ? { ...q, name: name.trim(), query: queryText.trim() }
          : q
      );
      localStorage.setItem("vulnxSavedQueries", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSavedQuery = (id: string) => {
    setSavedQueries((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      localStorage.setItem("vulnxSavedQueries", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveCurrentQuery = () => {
    const cleanedQuery = sanitizeQueryInput(query).trim();
    if (!cleanedQuery) return;

    setSaveDialogQueryText(cleanedQuery);
    setSaveDialogQueryName("");
    setShowSaveDialog(true);
  };

  const confirmSaveQuery = () => {
    if (saveDialogQueryName.trim() && saveDialogQueryText.trim()) {
      saveQuery(saveDialogQueryName, saveDialogQueryText);
      setShowSaveDialog(false);
      setSaveDialogQueryName("");
      setSaveDialogQueryText("");
    }
  };

  const cancelSaveQuery = () => {
    setShowSaveDialog(false);
    setSaveDialogQueryName("");
    setSaveDialogQueryText("");
  };

  const handleUseSavedQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    const encodedQuery = btoa(savedQuery.query);
    router.push(`/?q=${encodedQuery}`);
    performSearch(savedQuery.query);
  };

  const startEditingQuery = (savedQuery: SavedQuery) => {
    setEditingQueryId(savedQuery.id);
    setEditingQueryName(savedQuery.name);
    setEditingQueryText(savedQuery.query);
  };

  const saveEditedQuery = () => {
    if (editingQueryId && editingQueryName.trim() && editingQueryText.trim()) {
      updateSavedQuery(editingQueryId, editingQueryName, editingQueryText);
      setEditingQueryId(null);
      setEditingQueryName("");
      setEditingQueryText("");
    }
  };

  const cancelEditing = () => {
    setEditingQueryId(null);
    setEditingQueryName("");
    setEditingQueryText("");
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
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Queries
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <Input
                          ref={searchInputRef}
                          id="searchInput"
                          type="text"
                          placeholder="Search vulnerabilities by product, vendor, CVE ID..."
                          className="pl-10 pr-20"
                          value={query}
                          onChange={(e) =>
                            setQuery(sanitizeQueryInput(e.target.value))
                          }
                          onKeyDown={handleSearchInputKeyDown}
                          onFocus={() => {
                            if (searchHistory.length > 0 && !query) {
                              setShowHistory(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay to allow click on history items
                            setTimeout(() => setShowHistory(false), 200);
                          }}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-10">
                          {query.trim() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={handleSaveCurrentQuery}
                                    disabled={savedQueries.some(sq => sq.query === query.trim())}
                                    className={`p-1 transition-colors ${
                                      savedQueries.some(sq => sq.query === query.trim())
                                        ? "text-primary cursor-default"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    <Bookmark 
                                      className="h-4 w-4" 
                                      fill={savedQueries.some(sq => sq.query === query.trim()) ? "currentColor" : "none"}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {savedQueries.some(sq => sq.query === query.trim())
                                      ? "Query already saved"
                                      : "Save this query"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {query && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuery("");
                                setShowHistory(false);
                                setHistoryIndex(-1);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Search History Dropdown */}
                        {showHistory && searchHistory.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-[300px] overflow-auto">
                            <div className="py-1">
                              {searchHistory.map((item, index) => (
                                <div
                                  key={item}
                                  className={`group relative w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                                    historyIndex === index
                                      ? "bg-accent"
                                      : ""
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleHistoryItemClick(item)}
                                    className="w-full text-left pr-16"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{item}</span>
                                    </div>
                                  </button>
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={(e) => handleFillSearchInput(item, e)}
                                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                      aria-label="Edit search"
                                    >
                                      <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => removeFromSearchHistory(item, e)}
                                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                      aria-label="Remove from history"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {savedQueries.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="default"
                              >
                                <Bookmark className="h-4 w-4" />
                                Saved
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72">
                              {savedQueries.map((savedQuery, index) => (
                                <DropdownMenuItem
                                  key={savedQuery.id}
                                  onClick={() => handleUseSavedQuery(savedQuery)}
                                  className={`cursor-pointer py-3 ${index < savedQueries.length - 1 ? 'border-b border-border' : ''}`}
                                >
                                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    <div className="font-medium truncate">{savedQuery.name}</div>
                                    <div className="text-xs text-muted-foreground truncate font-mono">{savedQuery.query}</div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

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

            {/* Saved Queries Tab */}
            <TabsContent value="saved" className="space-y-6">
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl">Saved Queries</CardTitle>
                    <CardDescription className="text-sm">
                      Manage your saved search queries for quick access
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedQueries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        No saved queries yet
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Save queries from the Explore tab for quick access.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedQueries.map((savedQuery) => (
                        <div
                          key={savedQuery.id}
                          className="flex items-start gap-3 p-4 rounded-lg border border-border bg-secondary hover:bg-accent/50 transition-colors"
                        >
                          {editingQueryId === savedQuery.id ? (
                            <div className="flex-1 space-y-3">
                              <Input
                                type="text"
                                placeholder="Query name"
                                value={editingQueryName}
                                onChange={(e) => setEditingQueryName(e.target.value)}
                                className="font-medium"
                              />
                              <Input
                                type="text"
                                placeholder="Query text"
                                value={editingQueryText}
                                onChange={(e) => setEditingQueryText(sanitizeQueryInput(e.target.value))}
                                className="font-mono text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={saveEditedQuery}
                                  disabled={!editingQueryName.trim() || !editingQueryText.trim()}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-foreground mb-1">
                                  {savedQuery.name}
                                </h3>
                                <p className="text-xs text-muted-foreground font-mono break-all">
                                  {savedQuery.query}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Saved {new Date(savedQuery.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingQuery(savedQuery)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteSavedQuery(savedQuery.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Give your query a name to save it for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="queryName" className="text-sm font-medium">
                Query Name
              </label>
              <Input
                id="queryName"
                placeholder="e.g., Critical Apache vulnerabilities"
                value={saveDialogQueryName}
                onChange={(e) => setSaveDialogQueryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveDialogQueryName.trim()) {
                    confirmSaveQuery();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="queryText" className="text-sm font-medium">
                Query
              </label>
              <Input
                id="queryText"
                value={saveDialogQueryText}
                onChange={(e) => setSaveDialogQueryText(sanitizeQueryInput(e.target.value))}
                className="font-mono text-sm"
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelSaveQuery}>
              Cancel
            </Button>
            <Button
              onClick={confirmSaveQuery}
              disabled={!saveDialogQueryName.trim()}
            >
              Save Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
