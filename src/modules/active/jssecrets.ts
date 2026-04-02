import axios from 'axios';
import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export interface JSSecretsFinding {
  type: string;
  name: string;
  value: string;
  file: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export type JSSecretsResult = JSSecretsFinding[];

interface SecretPattern {
  name: string;
  type: string;
  regex: RegExp;
  description: string;
  severity: 'high' | 'medium' | 'low';
  postProcess?: (match: string) => string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'AWS Access Key',
    type: 'API_KEY',
    regex: /AKIA[0-9A-Z]{16}/g,
    description: 'AWS Access Key ID - grants programmatic access to AWS services',
    severity: 'high',
  },
  {
    name: 'AWS Secret Key',
    type: 'SECRET',
    regex:
      /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi,
    description: 'AWS Secret Access Key - sensitive credential for AWS authentication',
    severity: 'high',
  },
  {
    name: 'Google API Key',
    type: 'API_KEY',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    description: 'Google API Key - can be used to access Google services',
    severity: 'high',
  },
  {
    name: 'Stripe Secret Key',
    type: 'SECRET',
    regex: /sk_live_[0-9a-zA-Z]{24,}/g,
    description: 'Stripe Secret Key - allows charging payments and accessing sensitive data',
    severity: 'high',
  },
  {
    name: 'Stripe Publishable Key',
    type: 'API_KEY',
    regex: /pk_live_[0-9a-zA-Z]{24,}/g,
    description: 'Stripe Publishable Key - used for client-side payment integration',
    severity: 'medium',
  },
  {
    name: 'GitHub Token',
    type: 'TOKEN',
    regex: /ghp_[0-9a-zA-Z]{36}/g,
    description: 'GitHub Personal Access Token - grants access to GitHub API',
    severity: 'high',
  },
  {
    name: 'Generic Secret Key',
    type: 'SECRET',
    regex: /(?:secret|SECRET|Secret)\s*[:=]\s*['"]([A-Za-z0-9+/=_-]{16,})['"]/g,
    description: 'Generic secret key assignment - may contain sensitive credentials',
    severity: 'high',
  },
  {
    name: 'Generic API Key',
    type: 'API_KEY',
    regex: /(?:api_key|apiKey|API_KEY|apikey)\s*[:=]\s*['"]([A-Za-z0-9+/=_-]{16,})['"]/gi,
    description: 'Generic API key assignment - used for API authentication',
    severity: 'high',
  },
  {
    name: 'Password Assignment',
    type: 'CREDENTIAL',
    regex: /(?:password|passwd|PASSWORD|Password)\s*[:=]\s*['"]([^'"]{4,})['"]/gi,
    description: 'Hardcoded password detected in JavaScript code',
    severity: 'high',
  },
  {
    name: 'Private Key',
    type: 'SECRET',
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    description: 'Private key block detected - critical security credential exposed',
    severity: 'high',
  },
  {
    name: 'JWT Token',
    type: 'TOKEN',
    regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    description: 'JSON Web Token - may contain authentication credentials',
    severity: 'high',
  },
  {
    name: 'Bearer Token',
    type: 'TOKEN',
    regex: /(?:Bearer|bearer)\s+[A-Za-z0-9\-._~+/]+=*/g,
    description: 'Bearer token used for API authentication',
    severity: 'high',
  },
  {
    name: 'Firebase API Key',
    type: 'API_KEY',
    regex: /(?:apiKey|API_KEY)\s*[:=]\s*['"]([A-Za-z0-9-_]{30,})['"]/gi,
    description: 'Firebase API key found in configuration',
    severity: 'medium',
  },
  {
    name: 'Firebase Config',
    type: 'CONFIG',
    regex: /firebaseConfig|firebase\s*:\s*\{/gi,
    description: 'Firebase configuration object - may contain sensitive project details',
    severity: 'low',
  },
  {
    name: 'Vite Env Variable',
    type: 'ENV_VAR',
    regex: /import\.meta\.env\.(VITE_[A-Z_]+)\s*(?:=|:)\s*['"]([^'"]+)['"]/g,
    description: 'Vite environment variable with exposed value',
    severity: 'medium',
    postProcess: (match: string) => {
      const envMatch = match.match(
        /import\.meta\.env\.(VITE_[A-Z_]+)\s*(?:=|:)\s*['"]([^'"]+)['"]/
      );
      if (envMatch) {
        return `${envMatch[1]} = ${envMatch[2].slice(0, 8)}****`;
      }
      return match;
    },
  },
  {
    name: 'Generic Env Variable',
    type: 'ENV_VAR',
    regex: /process\.env\.([A-Z_]+)\s*(?:=|:)\s*['"]([^'"]{8,})['"]/g,
    description: 'Environment variable with hardcoded value',
    severity: 'medium',
  },
  {
    name: 'Internal API Endpoint',
    type: 'ENDPOINT',
    regex: /https?:\/\/(?:api|admin|internal|staging|dev|test)\.[^\s'"]+/gi,
    description: 'Internal or non-production API endpoint exposed in client-side code',
    severity: 'low',
  },
  {
    name: 'Database Connection String',
    type: 'CREDENTIAL',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/gi,
    description: 'Database connection string - may contain credentials',
    severity: 'high',
  },
  {
    name: 'Auth Token Assignment',
    type: 'TOKEN',
    regex:
      /(?:auth_token|accessToken|access_token|AUTH_TOKEN)\s*[:=]\s*['"]([A-Za-z0-9\-._~+/]+=*)['"]/gi,
    description: 'Authentication token assignment in client-side code',
    severity: 'high',
  },
  {
    name: 'Client Secret',
    type: 'SECRET',
    regex: /(?:client_secret|CLIENT_SECRET)\s*[:=]\s*['"]([A-Za-z0-9+/=_-]{16,})['"]/gi,
    description: 'OAuth client secret - sensitive credential for OAuth flows',
    severity: 'high',
  },
  {
    name: 'SendGrid API Key',
    type: 'API_KEY',
    regex: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
    description: 'SendGrid API key - can be used to send emails via SendGrid',
    severity: 'high',
  },
  {
    name: 'Slack Token',
    type: 'TOKEN',
    regex: /xox[baprs]-[0-9a-zA-Z-]+/g,
    description: 'Slack API token - grants access to Slack workspace',
    severity: 'high',
  },
  {
    name: 'Twilio Account SID',
    type: 'API_KEY',
    regex: /AC[0-9a-f]{32}/g,
    description: 'Twilio Account SID - used for Twilio API authentication',
    severity: 'medium',
  },
  {
    name: 'Twilio Auth Token',
    type: 'TOKEN',
    regex: /(?:twilio_auth_token|TWILIO_AUTH_TOKEN)\s*[:=]\s*['"]([0-9a-f]{32})['"]/gi,
    description: 'Twilio Auth Token - sensitive credential for SMS/Voice API',
    severity: 'high',
  },
  {
    name: 'Mailgun API Key',
    type: 'API_KEY',
    regex: /key-[0-9a-zA-Z]{32}/g,
    description: 'Mailgun API key - can be used to send emails via Mailgun',
    severity: 'high',
  },
  {
    name: 'OpenAI API Key',
    type: 'API_KEY',
    regex: /sk-proj-[A-Za-z0-9_-]+/g,
    description: 'OpenAI API key - grants access to OpenAI services',
    severity: 'high',
  },
  {
    name: 'Cloudflare API Key',
    type: 'API_KEY',
    regex: /(?:CF_API_KEY|CLOUDFLARE_API_KEY)\s*[:=]\s*['"]([A-Za-z0-9_-]{30,})['"]/gi,
    description: 'Cloudflare API key - can manage Cloudflare services',
    severity: 'high',
  },
  {
    name: 'Webhook URL',
    type: 'ENDPOINT',
    regex: /https?:\/\/[^\s'"]*\/webhook\/[^\s'"]+/gi,
    description: 'Webhook URL exposed in client-side code',
    severity: 'medium',
  },
  {
    name: 'Encryption Key',
    type: 'SECRET',
    regex:
      /(?:encryption_key|ENCRYPTION_KEY|cipher_key|CIPHER_KEY)\s*[:=]\s*['"]([^'"]{16,})['"]/gi,
    description: 'Encryption key assignment - critical for data security',
    severity: 'high',
  },
  {
    name: 'Session Secret',
    type: 'SECRET',
    regex: /(?:session_secret|SESSION_SECRET|sessionSecret)\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
    description: 'Session secret key - used for session signing',
    severity: 'high',
  },
];

function extractScriptUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const scriptTagRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = scriptTagRegex.exec(html)) !== null) {
    let src = match[1];
    if (urls.includes(src)) continue;

    if (src.startsWith('http://') || src.startsWith('https://')) {
      urls.push(src);
    } else if (src.startsWith('//')) {
      urls.push(`https:${src}`);
    } else {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        urls.push(absoluteUrl);
      } catch {
        // Skip invalid URLs
      }
    }
  }

  return urls;
}

async function scanFile(url: string): Promise<JSSecretsFinding[]> {
  const findings: JSSecretsFinding[] = [];

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      responseType: 'text',
      maxContentLength: 5 * 1024 * 1024, // 5MB max
    });

    if (response.status !== 200) return findings;

    const content = response.data;
    if (typeof content !== 'string') return findings;

    for (const pattern of SECRET_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const rawValue = match[0];
        const value = pattern.postProcess ? pattern.postProcess(rawValue) : rawValue;

        findings.push({
          type: pattern.type,
          name: pattern.name,
          value: value.length > 80 ? value.slice(0, 80) + '...' : value,
          file: url,
          description: pattern.description,
          severity: pattern.severity,
        });
      }
    }
  } catch {
    // Skip files that fail to load
  }

  return findings;
}

export const jssecrets: ActiveModule = {
  name: 'jssecrets',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<JSSecretsResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      let html: string | undefined;
      let baseUrl: string = fullUrl;

      if (sharedData?.html) {
        html = sharedData.html;
        baseUrl = sharedData.url || fullUrl;
      } else {
        try {
          const response = await axios.get(fullUrl, {
            timeout: 10000,
            responseType: 'text',
            maxContentLength: 5 * 1024 * 1024,
          });
          html = response.data;
        } catch {
          return { success: false, error: 'Could not fetch HTML content' };
        }
      }

      if (!html) {
        return { success: false, error: 'No HTML content available' };
      }

      const scriptUrls = extractScriptUrls(html, baseUrl);

      if (scriptUrls.length === 0) {
        return { success: false, error: 'No script URLs found in HTML' };
      }

      const scanPromises = scriptUrls.map(url => scanFile(url));
      const results = await Promise.allSettled(scanPromises);

      const allFindings: JSSecretsFinding[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allFindings.push(...result.value);
        }
      }

      if (allFindings.length === 0) {
        return { success: true, data: [], error: 'No secrets found' };
      }

      // Sort by severity: high first, then medium, then low
      const severityOrder = { high: 0, medium: 1, low: 2 };
      allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return { success: true, data: allFindings };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
