import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

interface WpPlugin {
  name: string;
  version: string;
}

export type WpluginsResult = WpPlugin[];

export const wplugins: ActiveModule = {
  name: 'wplugins',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<WpluginsResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const html = data.html;

      const plugins: Record<string, WpPlugin> = {};

      const patternPath =
        /\/wp-content\/plugins\/([a-zA-Z0-9_-]+)(?:\/[^"'>\s]*)?(?:["'\s].*?(?:ver|version)[=\s]+["']?([0-9][0-9a-zA-Z._-]*))?/gi;
      let match: RegExpExecArray | null;
      while ((match = patternPath.exec(html)) !== null) {
        const name = match[1];
        const version = match[2];
        if (!plugins[name]) {
          plugins[name] = { name, version: version || 'unknown' };
        } else if (version && plugins[name].version === 'unknown') {
          plugins[name].version = version;
        }
      }

      const patternVer =
        /\/wp-content\/plugins\/([a-zA-Z0-9_-]+)\/[^"'>\s]*\?(?:[^"'>\s]*&)?ver=([0-9][0-9a-zA-Z._-]*)/gi;
      while ((match = patternVer.exec(html)) !== null) {
        const name = match[1];
        const version = match[2];
        if (plugins[name] && plugins[name].version === 'unknown') {
          plugins[name].version = version;
        }
      }

      const patternComment =
        /<!--[^-]*?plugin[s]?\s*[:\-]?\s*([a-zA-Z0-9][a-zA-Z0-9_\- ]{2,40}?)(?:\s+v?([0-9][0-9a-zA-Z._-]*))?(?:\s+active|\s+enabled|-->)/gi;
      while ((match = patternComment.exec(html)) !== null) {
        const rawName = match[1].trim();
        const version = match[2];
        const slug = rawName.toLowerCase().replace(/ /g, '-');
        if (slug && !plugins[slug]) {
          plugins[slug] = { name: rawName, version: version || 'unknown' };
        }
      }

      const result = Object.values(plugins).slice(0, 20);

      if (result.length === 0) {
        return { success: false, error: 'No WordPress plugins found' };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
