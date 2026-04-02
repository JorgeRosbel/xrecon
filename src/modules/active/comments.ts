import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

export type CommentsResult = string[];

export const comments: ActiveModule = {
  name: 'comments',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<CommentsResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const { $ } = data;

      const html = $.html();
      const commentRegex = /<!--([\s\S]*?)-->/g;
      const found: string[] = [];

      let match;
      while ((match = commentRegex.exec(html)) !== null) {
        const comment = match[1].trim();
        if (comment) {
          found.push(comment);
        }
      }

      if (found.length === 0) {
        return { success: false, error: 'No HTML comments found' };
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
