import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

export interface ScriptsResult {
  scripts: string[];
  modulepreload: string[];
}

export const scripts: ActiveModule = {
  name: 'scripts',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<ScriptsResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const { $, url } = data;
      const baseUrl = new URL(url);

      const foundScripts: string[] = [];
      const foundModulepreload: string[] = [];

      $('script[src]').each((_i, el) => {
        let src = $(el).attr('src');
        if (!src || foundScripts.includes(src)) return;

        if (src.startsWith('http://') || src.startsWith('https://')) {
          foundScripts.push(src);
        } else if (src.startsWith('//')) {
          foundScripts.push(`https:${src}`);
        } else {
          const absoluteUrl = new URL(src, baseUrl.origin).href;
          foundScripts.push(absoluteUrl);
        }
      });

      $('link[rel="modulepreload"][href]').each((_i, el) => {
        let href = $(el).attr('href');
        if (!href || foundModulepreload.includes(href)) return;

        if (href.startsWith('http://') || href.startsWith('https://')) {
          foundModulepreload.push(href);
        } else if (href.startsWith('//')) {
          foundModulepreload.push(`https:${href}`);
        } else {
          try {
            const absoluteUrl = new URL(href, baseUrl.origin).href;
            foundModulepreload.push(absoluteUrl);
          } catch {
            // Skip invalid URLs
          }
        }
      });

      if (foundScripts.length === 0 && foundModulepreload.length === 0) {
        return { success: false, error: 'No script tags found' };
      }

      return { success: true, data: { scripts: foundScripts, modulepreload: foundModulepreload } };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
