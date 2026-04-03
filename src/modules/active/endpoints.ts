import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'UNKNOWN';
  source: 'js' | 'form';
  file?: string;
  baseUrl?: string;
  fullUrl?: string;
  dataType?: 'json' | 'form' | 'unknown';
}

export type EndpointsResult = Endpoint[];

function normalizeEndpointUrl(baseUrl: string, path: string): string {
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('//')) {
      return `https:${path}`;
    }
    return new URL(path, baseUrl).href;
  } catch {
    return path;
  }
}

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

async function fetchJsContent(scriptUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(scriptUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });
    if (response.status === 200 && typeof response.data === 'string') {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
}

function extractEndpointsFromJs(jsContent: string, baseUrl: string, fileName: string): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const baseOrigin = new URL(baseUrl).origin;
  const targetDomain = baseOrigin.replace(/^https?:\/\//, '');

  let detectedBaseUrl: string | undefined;
  let detectedDataType: 'json' | 'form' | 'unknown' = 'unknown';

  const axiosBaseUrlRegex = /axios\.create\s*\(\s*\{[^}]*baseURL\s*:\s*['"`]([^'"`]+)['"`]/gi;
  let baseUrlMatch;
  while ((baseUrlMatch = axiosBaseUrlRegex.exec(jsContent)) !== null) {
    if (baseUrlMatch[1]) {
      detectedBaseUrl = baseUrlMatch[1];
      break;
    }
  }

  if (!detectedBaseUrl) {
    const escapedDomain = targetDomain.replace(/\./g, '\\.');
    const subdomainPattern = new RegExp(
      '[\'"](https?://)?([a-zA-Z0-9-]+\\.)?(' + escapedDomain + ')[\'"]',
      'gi'
    );
    let subdomainMatch;
    while ((subdomainMatch = subdomainPattern.exec(jsContent)) !== null) {
      const potentialBaseUrl = subdomainMatch[1]
        ? subdomainMatch[1] + subdomainMatch[2] + subdomainMatch[3]
        : subdomainMatch[3];
      if (potentialBaseUrl && potentialBaseUrl !== targetDomain && potentialBaseUrl.includes('.')) {
        detectedBaseUrl = 'https://' + potentialBaseUrl;
        break;
      }
    }
  }

  if (!detectedBaseUrl) {
    const fetchConfigRegex =
      /fetch\s*\([^,]+,\s*\{[^}]*headers\s*:\s*\{[^}]*['"]Content-Type['"]\s*:\s*['"]([^'"`]+)['"]/gi;
    let fetchMatch;
    while ((fetchMatch = fetchConfigRegex.exec(jsContent)) !== null) {
      if (fetchMatch[1]?.includes('application/json')) {
        detectedDataType = 'json';
      } else if (fetchMatch[1]?.includes('application/x-www-form-urlencoded')) {
        detectedDataType = 'form';
      }
    }
  }

  const hasJsonContentType =
    jsContent.includes('application/json') ||
    (jsContent.includes('Content-Type') && jsContent.includes('json'));
  if (hasJsonContentType) {
    detectedDataType = 'json';
  }

  if (detectedDataType === 'unknown') {
    const hasJsonStringify = jsContent.includes('JSON.stringify');
    const hasJsonParse = jsContent.includes('.json()');
    if (hasJsonStringify || hasJsonParse) {
      detectedDataType = 'json';
    }
  }

  const patterns = [
    {
      regex:
        /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{[^}]*method\s*:\s*['"`]([^'"`]+)['"`][^}]*\})?/gi,
      extractMethod: (m: RegExpMatchArray) => (m[2] ? m[2].toUpperCase() : 'GET'),
    },
    {
      regex: /axios\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      extractMethod: (m: RegExpMatchArray) => m[1].toUpperCase(),
    },
    {
      regex:
        /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`][^}]*(?:method|type)\s*:\s*['"`]([^'"`]+)['"`][^}]*\}/gi,
      extractMethod: (m: RegExpMatchArray) => m[2].toUpperCase(),
    },
    {
      regex: /\$\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      extractMethod: (m: RegExpMatchArray) => m[1].toUpperCase(),
    },
    {
      regex: /xhr\.open\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
      extractMethod: (m: RegExpMatchArray) => m[1].toUpperCase(),
    },
    {
      regex: /XMLHttpRequest.*\.open\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
      extractMethod: (m: RegExpMatchArray) => m[1].toUpperCase(),
    },
    {
      regex: /\$\w+\.(get|post|put|patch|delete|head|options)\s*\(\s*[^,)]+/gi,
      extractMethod: (m: RegExpMatchArray) => m[1].toUpperCase(),
      isMinified: true,
    },
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(jsContent)) !== null) {
      let path: string;
      let method: string;

      if (
        pattern.regex.source.includes('xhr.open') ||
        pattern.regex.source.includes('XMLHttpRequest')
      ) {
        method = match[1];
        path = match[2];
      } else if (pattern.isMinified) {
        method = pattern.extractMethod(match);
        path = match[0].split(/[,(]/)[1]?.trim() || '';
      } else {
        path = match[1];
        method = pattern.extractMethod(match);
      }

      const normalizedPath = path.trim().replace(/^[`'"]|["'`]$/g, '');
      if (!normalizedPath || normalizedPath.length < 2) continue;

      let fullUrl: string | undefined;

      if (
        normalizedPath.startsWith('http://') ||
        normalizedPath.startsWith('https://') ||
        normalizedPath.startsWith('//')
      ) {
        fullUrl = normalizeEndpointUrl(baseOrigin, normalizedPath);
      } else if (normalizedPath.startsWith('/') && detectedBaseUrl) {
        fullUrl = detectedBaseUrl + normalizedPath;
      }

      if (
        normalizedPath.startsWith('http://') ||
        normalizedPath.startsWith('https://') ||
        normalizedPath.startsWith('//') ||
        normalizedPath.startsWith('/')
      ) {
        if (
          fullUrl?.includes('/api/') ||
          fullUrl?.includes('/v1/') ||
          fullUrl?.includes('/v2/') ||
          fullUrl?.includes('/rest/') ||
          fullUrl?.includes('/graphql') ||
          fullUrl?.includes('/auth/')
        ) {
          endpoints.push({
            path: normalizedPath,
            fullUrl,
            method: method as Endpoint['method'],
            source: 'js',
            file: fileName,
            baseUrl: detectedBaseUrl,
            dataType: detectedDataType,
          });
        }
      }
    }
  }

  const apiPathPatterns = [
    /['"`]([^'"`]*\/api\/[^'"`]+)['"`]/gi,
    /['"`]([^'"`]*\/v\d+\/[^'"`]+)['"`]/gi,
    /['"`]([^'"`]*\/rest\/[^'"`]+)['"`]/gi,
    /['"`]([^'"`]*\/graphql[^'"`]+)['"`]/gi,
    /['"`]([^'"`]*\/auth\/[a-zA-Z0-9_-]+)['"`]/gi,
  ];

  for (const pattern of apiPathPatterns) {
    let match;
    while ((match = pattern.exec(jsContent)) !== null) {
      const path = match[1];
      if (!path || path.length < 3) continue;

      let fullUrl: string | undefined;
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
        fullUrl = normalizeEndpointUrl(baseOrigin, path);
      } else if (detectedBaseUrl) {
        fullUrl = detectedBaseUrl + path;
      }

      const exists = endpoints.some(e => e.path === path);
      if (!exists) {
        endpoints.push({
          path,
          fullUrl,
          method: 'UNKNOWN',
          source: 'js',
          file: fileName,
          baseUrl: detectedBaseUrl,
          dataType: detectedDataType,
        });
      }
    }
  }

  return endpoints;
}

function extractEndpointsFromForms($: cheerio.CheerioAPI): Endpoint[] {
  const endpoints: Endpoint[] = [];

  $('form[action]').each((_i, el) => {
    const action = $(el).attr('action');
    const method = $(el).attr('method') || 'POST';
    const enctype = $(el).attr('enctype');

    if (!action) return;

    const formDataType =
      enctype?.includes('multipart') || enctype?.includes('urlencoded') ? 'form' : 'unknown';

    let fullUrl: string | undefined;
    if (action.startsWith('http://') || action.startsWith('https://')) {
      fullUrl = action;
    }

    endpoints.push({
      path: action,
      fullUrl,
      method: method.toUpperCase() as Endpoint['method'],
      source: 'form',
      dataType: formDataType,
    });
  });

  return endpoints;
}

export const endpoints: ActiveModule = {
  name: 'endpoints',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<EndpointsResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const baseUrl = fullUrl;
      const allEndpoints: Endpoint[] = [];
      const processedFiles = new Set<string>();

      let scriptUrls: string[] = [];

      if (sharedData?.scripts && sharedData.scripts.length > 0) {
        scriptUrls = sharedData.scripts;
      } else if (sharedData?.html) {
        scriptUrls = extractScriptUrls(sharedData.html, baseUrl);
      }

      if (scriptUrls.length === 0 && sharedData?.html) {
        scriptUrls = extractScriptUrls(sharedData.html, baseUrl);
      }

      for (const scriptUrl of scriptUrls) {
        if (processedFiles.has(scriptUrl)) continue;
        processedFiles.add(scriptUrl);

        const fileName = scriptUrl.split('/').pop() || 'unknown';
        const jsContent = await fetchJsContent(scriptUrl);

        if (jsContent) {
          const found = extractEndpointsFromJs(jsContent, baseUrl, fileName);
          allEndpoints.push(...found);
        }
      }

      if (sharedData?.html) {
        const $ = cheerio.load(sharedData.html);
        const formEndpoints = extractEndpointsFromForms($);
        allEndpoints.push(...formEndpoints);
      }

      const uniqueEndpoints = allEndpoints.filter(
        (endpoint, index, self) =>
          index === self.findIndex(e => e.path === endpoint.path && e.method === endpoint.method)
      );

      if (uniqueEndpoints.length === 0) {
        return { success: false, error: 'No endpoints found' };
      }

      return { success: true, data: uniqueEndpoints };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
