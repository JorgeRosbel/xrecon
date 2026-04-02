import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

export interface MetadataResult {
  title: string;
  description: string;
}

export const metadata: ActiveModule = {
  name: 'metadata',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<MetadataResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const { $ } = data;

      const title =
        $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
      const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '';

      return {
        success: true,
        data: {
          title,
          description,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch metadata for ${target}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
