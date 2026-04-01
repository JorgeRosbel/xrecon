import axios from 'axios';
import type { ActiveModule, ModuleResult } from '@/types';

export const sitemap: ActiveModule = {
  name: 'sitemap',
  async run(target: string): Promise<ModuleResult> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const urls = [`https://${hostname}/sitemap.xml`, `https://${hostname}/sitemap_index.xml`];

      let foundSitemap = '';
      for (const url of urls) {
        try {
          const response = await axios.get(url, {
            timeout: 10000,
            validateStatus: () => true,
          });
          if (response.status === 200) {
            foundSitemap = url;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!foundSitemap) {
        return { success: false, error: 'No sitemap found' };
      }

      return { success: true, data: { url: foundSitemap } };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
