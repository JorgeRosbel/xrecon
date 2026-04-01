import type { ActiveModule, ModuleResult, SharedHtmlData, PhoneResult } from '@/types';

export const phones: ActiveModule = {
  name: 'phones',
  async run(_target: string, sharedData: SharedHtmlData): Promise<ModuleResult<PhoneResult>> {
    try {
      const { html } = sharedData;

      const pattern =
        /(?:\+|00)[1-9][0-9]{0,2}[ -]?(?:\([0-9]{1,4}\)|[0-9]{1,4})(?:[ -]?[0-9]){6,12}/gi;

      const matches = html.match(pattern);

      if (!matches) {
        return { success: true, data: [] };
      }

      const cleanedPhones = matches.map(phone => phone.replace(/\D/g, ''));

      const uniquePhones = [...new Set(cleanedPhones)];

      const finalPhones: string[] = [];
      for (const phone of uniquePhones) {
        if (phone.length >= 7 && phone.length <= 15) {
          finalPhones.push(`+${phone}`);
        }
      }

      finalPhones.sort();

      return { success: true, data: finalPhones };
    } catch {
      return { success: false, data: [] };
    }
  },
};
