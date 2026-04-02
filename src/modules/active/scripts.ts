import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export type ScriptsResult = string[];

export const scripts: ActiveModule = {
  name: 'scripts',
  async run(_target: string, sharedData: SharedHtmlData): Promise<ModuleResult<ScriptsResult>> {
    try {
      const { $, url } = sharedData;
      const baseUrl = new URL(url);

      const found: string[] = [];

      $('script[src]').each((_i, el) => {
        let src = $(el).attr('src');
        if (!src || found.includes(src)) return;

        if (src.startsWith('http://') || src.startsWith('https://')) {
          found.push(src);
        } else if (src.startsWith('//')) {
          found.push(`https:${src}`);
        } else {
          const absoluteUrl = new URL(src, baseUrl.origin).href;
          found.push(absoluteUrl);
        }
      });

      if (found.length === 0) {
        return { success: false, error: 'No script tags found' };
      }

      return { success: true, data: found };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
