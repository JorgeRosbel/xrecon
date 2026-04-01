import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ActiveModule, ModuleResult } from '@/types';

export type RoutesResult = string[];

async function fetchSitemapUrls(sitemapUrl: string, visited: Set<string>): Promise<string[]> {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);

  try {
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status !== 200) return [];

    const xml = response.data as string;
    const $ = cheerio.load(xml, { xmlMode: true });
    const urls: string[] = [];

    const isIndex = $('sitemap').length > 0;

    if (isIndex) {
      $('loc').each((_i, el) => {
        const loc = $(el).text().trim();
        if (loc) {
          urls.push(...[...new Set(fetchSitemapUrlsSync(loc, visited))]);
        }
      });
    } else {
      $('loc').each((_i, el) => {
        const loc = $(el).text().trim();
        if (loc && !loc.endsWith('.xml')) {
          urls.push(loc);
        }
      });
    }

    return urls;
  } catch {
    return [];
  }
}

async function fetchSitemapUrlsAsync(sitemapUrl: string, visited: Set<string>): Promise<string[]> {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);

  try {
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status !== 200) return [];

    const xml = response.data as string;
    const $ = cheerio.load(xml, { xmlMode: true });
    const urls: string[] = [];

    const isIndex = $('sitemap').length > 0;

    if (isIndex) {
      const nestedSitemaps: string[] = [];
      $('loc').each((_i, el) => {
        const loc = $(el).text().trim();
        if (loc) nestedSitemaps.push(loc);
      });

      for (const nestedUrl of nestedSitemaps) {
        const nestedUrls = await fetchSitemapUrlsAsync(nestedUrl, visited);
        urls.push(...nestedUrls);
      }
    } else {
      $('loc').each((_i, el) => {
        const loc = $(el).text().trim();
        if (loc && !loc.endsWith('.xml')) {
          urls.push(loc);
        }
      });
    }

    return urls;
  } catch {
    return [];
  }
}

function fetchSitemapUrlsSync(sitemapUrl: string, visited: Set<string>): string[] {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);
  return [];
}

export const routes: ActiveModule = {
  name: 'routes',
  async run(target: string): Promise<ModuleResult<RoutesResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const robotsUrl = `https://${hostname}/robots.txt`;

      let sitemapUrls: string[] = [];

      try {
        const robotsResponse = await axios.get(robotsUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });

        if (robotsResponse.status === 200) {
          const content = robotsResponse.data as string;
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('Sitemap:')) {
              const url = trimmed.substring(8).trim();
              if (url) sitemapUrls.push(url);
            }
          }
        }
      } catch {
        // ignore
      }

      if (sitemapUrls.length === 0) {
        const fallbackUrls = [
          `https://${hostname}/sitemap.xml`,
          `https://${hostname}/sitemap_index.xml`,
        ];
        for (const url of fallbackUrls) {
          try {
            const response = await axios.get(url, {
              timeout: 10000,
              validateStatus: () => true,
            });
            if (response.status === 200) {
              sitemapUrls.push(url);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      if (sitemapUrls.length === 0) {
        return { success: false, error: 'No sitemaps found' };
      }

      const visited = new Set<string>();
      const allUrls: string[] = [];

      for (const sitemapUrl of sitemapUrls) {
        const urls = await fetchSitemapUrlsAsync(sitemapUrl, visited);
        allUrls.push(...urls);
      }

      const uniqueUrls = [...new Set(allUrls)];

      if (uniqueUrls.length === 0) {
        return { success: false, error: 'No routes found in sitemaps' };
      }

      return { success: true, data: uniqueUrls };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
