import axios from 'axios';
import type { ActiveModule, ModuleResult } from '@/types';

export type WpluginsResult = string[];

export const wplugins: ActiveModule = {
  name: 'wplugins',
  async run(target: string): Promise<ModuleResult<WpluginsResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const url = `https://${hostname}/wp-content/plugins/`;

      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return {
          success: false,
          error: 'WordPress not detected or plugins directory not accessible',
        };
      }

      const html = response.data as string;
      const pluginMatches = html.match(/\/wp-content\/plugins\/([a-zA-Z0-9_-]+)\//g);

      if (!pluginMatches) {
        return { success: false, error: 'No plugins found' };
      }

      const plugins = [...new Set(pluginMatches.map(m => m.split('/')[3]))];

      return { success: true, data: plugins };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
