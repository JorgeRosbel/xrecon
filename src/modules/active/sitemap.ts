import type { ActiveModule, ModuleResult } from '@/types';

export const sitemap: ActiveModule = {
  name: 'sitemap',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'sitemap' } };
  },
};
