import axios from 'axios';
import https from 'https';
import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export interface RobotsResult {
  url: string;
  disallowed: string[];
  allowed: string[];
  sitemaps: string[];
}

export const robots: ActiveModule = {
  name: 'robots',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<RobotsResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const url = `https://${hostname}/robots.txt`;
      const httpsAgent = new https.Agent({ rejectUnauthorized: false });

      const response = await axios.get(url, {
        timeout: 10000,
        httpsAgent,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return { success: false, error: 'No robots.txt found' };
      }

      const content = response.data as string;

      if (sharedData) {
        sharedData.robotsContent = content;
      }

      const lines = content.split('\n');
      const disallowed: string[] = [];
      const allowed: string[] = [];
      const sitemaps: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Disallow:')) {
          const path = trimmed.substring(9).trim();
          if (path) disallowed.push(path);
        } else if (trimmed.startsWith('Allow:')) {
          const path = trimmed.substring(6).trim();
          if (path) allowed.push(path);
        } else if (trimmed.startsWith('Sitemap:')) {
          const sitemapUrl = trimmed.substring(8).trim();
          if (sitemapUrl) {
            sitemaps.push(sitemapUrl);
            if (sharedData) {
              sharedData.sitemapUrls = [...(sharedData.sitemapUrls || []), sitemapUrl];
            }
          }
        }
      }

      return {
        success: true,
        data: { url, disallowed, allowed, sitemaps },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
