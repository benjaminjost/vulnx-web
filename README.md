<div align="center">

<h1>vulnxWeb</h1>

<p>Minimal web application for searching and exploring Common Vulnerabilities and Exposures (CVEs)</p>

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-18181B?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

</div>

## Quick Start

### Prerequisites

- (Optional) API key from [ProjectDiscovery](https://cloud.projectdiscovery.io/) – recommended for higher rate limits

### Installation

```bash
git clone https://github.com/benjaminjost/vulnx-web.git
cd vulnx-web
npm install   # or pnpm install / yarn install
npm run dev   # http://localhost:3000
```

### Configure API Key (Optional)

The application works without an API key but with rate limits. For better performance:

1. Open the app and go to the **Settings** tab.
2. Paste your ProjectDiscovery API key.
3. Click **Save Configuration** (stored in `localStorage` only).

## Usage

### Searching for Vulnerabilities

1. Type a query (e.g., `vendor:microsoft && severity:high`).
2. Click **Query Info** to discover filter names, syntax, and quick inserts.
3. Press **Search** (or Enter). Results populate the table.
4. Click a row to expand detailed metadata, PoCs, Nuclei templates, etc.
5. Click a CVE ID to open the detailed CVE page.

#### Example Queries

```text
product:openssl && severity:critical
cve_id:CVE-2024-1234
vendor:adobe && isTemplate:true
```

#### Shareable Search Links

Search queries are automatically encoded in the URL, allowing you to share direct links to specific searches:

```text
https://your-domain.com/?q=cHJvZHVjdD1teXNxbA==
```

The query parameter `q` contains a base64-encoded search string that auto-triggers the search on page load.

### CVE Detail Pages

Access comprehensive vulnerability information for any CVE:

```text
https://your-domain.com/CVE-2025-1234
https://your-domain.com/CVE-2025-5678
```

## Project Structure

```
vulnx-web/
├── src/
│   ├── app/
│   │   ├── [cveId]/       # Dynamic CVE detail route
│   │   ├── home.tsx       # Main search page implementation
│   │   ├── layout.tsx     # Root layout with theme provider
│   │   ├── page.tsx       # Main page wrapper
│   │   ├── robots.ts      # Robots.txt generation
│   │   └── sitemap.ts     # Sitemap generation
│   ├── components/
│   │   ├── cve-columns.tsx    # Table column definitions
│   │   ├── cve-details.tsx    # Shared CVE details component
│   │   ├── cve-header.tsx     # CVE header component
│   │   ├── data-table.tsx     # Reusable data table
│   │   ├── header.tsx         # App header with theme toggle
│   │   ├── footer.tsx         # App footer
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   └── projectdiscovery-api.ts  # API integration
│   └── models/
│       └── CVERecord.ts       # CVE data model
├── public/                    # Static assets
├── next.config.ts             # Next.js configuration
├── open-next.config.ts        # Cloudflare Workers config
├── wrangler.jsonc             # Cloudflare deployment
└── package.json
```

## Routes

- **`/`** — Main search interface with CVE query functionality
- **`/{CVEID}`** — Detailed CVE page (e.g., `/CVE-2025-1234`)
- **`/?q={base64}`** — Pre-populated search with auto-trigger

## Security & Privacy

- API keys are kept client-side (`localStorage`).
- Requests go directly from the browser to ProjectDiscovery’s API.

## Data Sources

Vulnx Web uses [ProjectDiscovery’s CVEMap](https://github.com/projectdiscovery/cvemap), which aggregates:

- [NVD](https://nvd.nist.gov/developers) – primary CVE feed
- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) – known exploited vulnerabilities
- [HackerOne](https://hackerone.com/hacktivity/cve_discovery) – disclosure feeds
- [Trickest CVE](https://github.com/trickest/cve) / [PoC-in-GitHub](https://github.com/nomi-sec/PoC-in-GitHub/) – PoC references

## Deployment

```bash
npm run build             # Next.js production build
npm run preview           # OpenNext Cloudflare preview
npm run deploy            # Deploy via OpenNext -> Cloudflare Workers
```

Adjust `wrangler.jsonc` for custom domains or caching rules.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Commit your changes (`git commit -m "feat: improve X"`)
4. Push and open a Pull Request

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
