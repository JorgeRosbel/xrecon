import type { ActiveModule, ModuleResult } from '@/types';

export const os: ActiveModule = {
  name: 'os',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'os' } };
  },
};
