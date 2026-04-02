import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export interface SitemapResult {
  sitemapIndexes: string[];
  sitemaps: string[];
}

async function fetchAndParseSitemap(url: string): Promise<{
  urls: string[];
  isIndex: boolean;
  childSitemaps: string[];
}> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.status !== 200) {
      return { urls: [], isIndex: false, childSitemaps: [] };
    }

    const html = response.data;
    if (typeof html !== 'string') {
      return { urls: [], isIndex: false, childSitemaps: [] };
    }

    const $ = cheerio.load(html, { xmlMode: true });
    const urls: string[] = [];
    const childSitemaps: string[] = [];

    $('loc').each((_i, el) => {
      const loc = $(el).text().trim();
      if (!loc) return;

      if (loc.toLowerCase().includes('sitemap')) {
        childSitemaps.push(loc);
      }
    });

    const isIndex = $('sitemapindex').length > 0 || childSitemaps.length > 0;

    return { urls, isIndex, childSitemaps };
  } catch {
    return { urls: [], isIndex: false, childSitemaps: [] };
  }
}

async function discoverSitemaps(
  initialUrls: string[],
  visited: Set<string>,
  allSitemaps: string[],
  allIndexes: string[],
  depth: number = 0
): Promise<void> {
  if (depth > 3 || initialUrls.length === 0) return;

  for (const url of initialUrls) {
    if (visited.has(url)) continue;
    visited.add(url);

    const result = await fetchAndParseSitemap(url);

    if (result.isIndex) {
      allIndexes.push(url);
      if (result.childSitemaps.length > 0) {
        await discoverSitemaps(result.childSitemaps, visited, allSitemaps, allIndexes, depth + 1);
      }
    } else {
      allSitemaps.push(url);
    }
  }
}

export const sitemap: ActiveModule = {
  name: 'sitemap',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<SitemapResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const baseUrl = `https://${hostname}`;

      const sitemapUrls: string[] = [];

      if (sharedData?.sitemapUrls && sharedData.sitemapUrls.length > 0) {
        sitemapUrls.push(...sharedData.sitemapUrls);
      }

      const defaultUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemap-index.xml`,
      ];

      for (const url of defaultUrls) {
        if (!sitemapUrls.includes(url)) {
          sitemapUrls.push(url);
        }
      }

      const checkedUrls: string[] = [];
      for (const url of sitemapUrls) {
        try {
          const response = await axios.head(url, {
            timeout: 5000,
            validateStatus: () => true,
          });
          if (response.status === 200) {
            checkedUrls.push(url);
          }
        } catch {
          try {
            const response = await axios.get(url, {
              timeout: 5000,
              validateStatus: () => true,
            });
            if (response.status === 200) {
              checkedUrls.push(url);
            }
          } catch {
            continue;
          }
        }
      }

      if (checkedUrls.length === 0) {
        return { success: false, error: 'No sitemap found' };
      }

      const visited = new Set<string>();
      const allSitemaps: string[] = [];
      const allIndexes: string[] = [];

      await discoverSitemaps(checkedUrls, visited, allSitemaps, allIndexes);

      const result: SitemapResult = {
        sitemapIndexes: allIndexes,
        sitemaps: allSitemaps,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
