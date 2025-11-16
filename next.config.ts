import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const buildCsp = () => {
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com"
    : "'self' https://static.cloudflareinsights.com";

  const connectSrc = [
    "'self'",
    "https://api.projectdiscovery.io",
    "https://cloudflareinsights.com",
  ];

  if (isDev) {
    connectSrc.push("ws://localhost:3000", "ws://localhost:3001");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
};

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildCsp(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
