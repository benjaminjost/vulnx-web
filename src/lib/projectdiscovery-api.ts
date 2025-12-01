import { CVERecord } from "@/models/CVERecord";

export interface SearchOptions {
  query: string;
}

export interface SearchResult {
  success: boolean;
  data?: CVERecord[];
  error?: string;
}

export interface FilterInfo {
  field: string;
  description: string;
  examples: string[];
  enum_values?: string[];
}

export interface FilterResult {
  success: boolean;
  data?: FilterInfo[];
  error?: string;
}

/**
 * Performs a CVE search against the ProjectDiscovery API
 * @param options - Search options including query
 * @returns Search result with CVE records or error
 */
export async function searchCVE(options: SearchOptions): Promise<SearchResult> {
  try {
    const encodedQuery = encodeURIComponent(`(${options.query})`);
    const apiUrl = `https://api.projectdiscovery.io/v2/vulnerability/search?q=${encodedQuery}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const apiKey =
      globalThis.window === undefined
        ? null
        : localStorage.getItem("vulnxApiKey");

    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error:
            "Invalid or missing API key. Please check your API configuration in Settings.",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: "CVE not found.",
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error:
            "Rate limit exceeded. Configure an API key in Settings for higher rate limits, or wait a moment and try again.",
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          error:
            "Server error. The API service is temporarily unavailable. Please try again later.",
        };
      } else {
        return {
          success: false,
          error: `Search failed (${response.status}). Please check your query.`,
        };
      }
    }

    const data = await response.json();

    if (data && typeof data === "object" && Array.isArray(data.results)) {
      const cveRecords = data.results.map((item: any) => new CVERecord(item));

      if (cveRecords.length === 0) {
        return {
          success: false,
          error: "No results found.",
        };
      }

      return {
        success: true,
        data: cveRecords,
      };
    } else {
      return {
        success: false,
        error: "Invalid response format from API.",
      };
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Failed to fetch") {
        return {
          success: false,
          error:
            "Unable to connect to the API. Please check your internet connection and try again.",
        };
      }
      return {
        success: false,
        error: err.message,
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Fetches available query filters from the ProjectDiscovery API
 * @returns Filter result with filter information or error
 */
export async function fetchFilters(): Promise<FilterResult> {
  try {
    const response = await fetch(
      "https://api.projectdiscovery.io/v2/vulnerability/filters",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch filters (${response.status}).`,
      };
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      const filteredData = data
        .filter((item: any) => item.examples && item.examples.length > 0)
        .map((item: any) => ({
          field: item.field,
          description: item.description,
          examples: item.examples,
          enum_values: item.enum_values || undefined,
        }));

      return {
        success: true,
        data: filteredData,
      };
    } else {
      return {
        success: false,
        error: "Invalid response format from API.",
      };
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Failed to fetch") {
        return {
          success: false,
          error:
            "Unable to connect to the API. Please check your internet connection.",
        };
      }
      return {
        success: false,
        error: err.message,
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
