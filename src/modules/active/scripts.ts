import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

export type ScriptsResult = string[];

export const scripts: ActiveModule = {
  name: 'scripts',
  async run(_target: string, sharedData: SharedHtmlData): Promise<ModuleResult<ScriptsResult>> {
    try {
      const { $ } = sharedData;

      const found: string[] = [];

      $('script[src]').each((_i, el) => {
        const src = $(el).attr('src');
        if (src && !found.includes(src)) {
          found.push(src);
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
