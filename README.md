<div align="center">

<h1>vulnxWeb</h1> 

<p>Minimal web application for searching and exploring Common Vulnerabilities and Exposures (CVEs) </p>

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

</div>


## Quick Start

### Prerequisites

- API key from [ProjectDiscovery](https://cloud.projectdiscovery.io/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/benjaminjost/vulnx-web.git
   cd vulnx-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

5. **Configure API Key**
   - Click the **Settings** button in the top-right corner
   - Enter your ProjectDiscovery API key
   - Click **Save Configuration**

## Usage

### Searching for Vulnerabilities

1. **Select Search Type**: Choose from Product, CVE ID, or Vendor in the dropdown
2. **Enter Search Term**: Type your query in the search bar
3. **Apply Filters** (Optional): Click the Filters button to refine results by severity or date
4. **View Results**: Click on any CVE row to expand and view detailed information

### Example Searches

- **By Product**: `Apache Struts`, `WordPress`, `OpenSSL`
- **By CVE ID**: `CVE-2024-1234`, `CVE-2023-*`
- **By Vendor**: `Microsoft`, `Google`, `Adobe`

## Project Structure

```
vulnx-web/
├── app/                # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── searchbar.tsx   # Search bar and filters
│   ├── settings.tsx    # API configuration panel
│   └── table.tsx       # CVE results table
├── public/             # Static assets
├── package.json        # Dependencies
├── next.config.js      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
├── LICENSE             # MIT license
└── README.md           # Project documentation
```

## Data Sources

Vulnx Web leverages the [CVEMap](https://github.com/projectdiscovery/cvemap) tool by ProjectDiscovery, which aggregates vulnerability data from multiple authoritative sources:

- **[National Vulnerability Database (NVD)](https://nvd.nist.gov/developers)** - Comprehensive CVE vulnerability data
- **[Known Exploited Vulnerabilities (KEV)](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)** - CISA's catalog of actively exploited vulnerabilities
- **[HackerOne](https://hackerone.com/hacktivity/cve_discovery)** - CVE discoveries and disclosures
- **[Trickest CVE](https://github.com/trickest/cve) / [PoC-in-GitHub](https://github.com/nomi-sec/PoC-in-GitHub/)** - Proof-of-Concept references from GitHub

## Contributing

Contributions are welcome! If you would like to contribute to this project:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
