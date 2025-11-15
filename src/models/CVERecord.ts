export class CVERecord {
  cveId: string;
  name: string;
  description: string;
  score: number;
  severity: string;
  ageInDays: number;
  hasPoC: boolean;
  publishedAt: Date;
  updatedAt: Date;
  product: string | null;
  vendor: string | null;
  vector: string | null;
  weaknesses: string[];
  references: string[];
  patches: string[];
  pocUrls: string[];
  impact: string | null;
  remediation: string | null;
  requirements: string | null;
  isPatchAvailable: boolean;
  vulnerabilityType: string | null;
  isRemote: boolean;
  isAuth: boolean;
  isExploitSeen: boolean;
  isTemplate: boolean;
  uri: string | null;

  constructor({
    cve_id,
    name,
    description,
    cvss_score,
    severity,
    age_in_days,
    is_poc,
    cve_created_at,
    cve_updated_at,
    affected_products = [],
    cvss_metrics,
    weaknesses = [],
    citations = [],
    remediation,
    pocs = [],
    impact,
    requirements,
    is_patch_available,
    vulnerability_type,
    is_remote,
    is_auth,
    is_exploit_seen,
    is_template,
    uri
  }: Record<string, unknown>) {
    this.cveId = typeof cve_id === 'string' ? cve_id : '';
    this.name = typeof name === 'string' ? name : '';
    this.description = typeof description === 'string' ? description : '';
    this.score = typeof cvss_score === 'number' ? cvss_score : 0;
    this.severity = typeof severity === 'string' ? severity : '';
    this.ageInDays = typeof age_in_days === 'number' ? age_in_days : 0;
    this.hasPoC = typeof is_poc === 'boolean' ? is_poc : false;
    this.publishedAt = cve_created_at ? new Date(cve_created_at as string) : new Date();
    this.updatedAt = cve_updated_at ? new Date(cve_updated_at as string) : new Date();

    const affectedProductsArray = Array.isArray(affected_products) ? affected_products : [];
    const firstProduct = affectedProductsArray.length > 0 ? affectedProductsArray[0] as Record<string, unknown> : null;
    this.product = firstProduct && typeof firstProduct.product === 'string' ? firstProduct.product : null;
    this.vendor = firstProduct && typeof firstProduct.vendor === 'string' ? firstProduct.vendor : null;

    this.vector = typeof cvss_metrics === 'string' ? cvss_metrics : null;

    const weaknessesArray = Array.isArray(weaknesses) ? weaknesses : [];
    this.weaknesses = weaknessesArray.map((w: any) => {
      if (typeof w === 'object' && w !== null && typeof w.cwe_name === 'string') {
        return w.cwe_name;
      }
      return String(w);
    });

    const citationsArray = Array.isArray(citations) ? citations : [];
    this.references = citationsArray.map((c: any) => {
      if (typeof c === 'object' && c !== null && typeof c.url === 'string') {
        return c.url;
      }
      return String(c);
    });

    this.patches = typeof remediation === 'string' ? [remediation] : [];

    const pocsArray = Array.isArray(pocs) ? pocs : [];
    this.pocUrls = pocsArray.map((p: any) => {
      if (typeof p === 'object' && p !== null && typeof p.url === 'string') {
        return p.url;
      }
      return String(p);
    });

    this.impact = typeof impact === 'string' ? impact : null;
    this.remediation = typeof remediation === 'string' ? remediation : null;
    this.requirements = typeof requirements === 'string' ? requirements : null;
    this.isPatchAvailable = typeof is_patch_available === 'boolean' ? is_patch_available : false;
    this.vulnerabilityType = typeof vulnerability_type === 'string' ? vulnerability_type : null;
    this.isRemote = typeof is_remote === 'boolean' ? is_remote : false;
    this.isAuth = typeof is_auth === 'boolean' ? is_auth : false;
    this.isExploitSeen = typeof is_exploit_seen === 'boolean' ? is_exploit_seen : false;
    this.isTemplate = typeof is_template === 'boolean' ? is_template : false;
    this.uri = typeof uri === 'string' ? uri : null;
  }
}
