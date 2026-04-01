import axios from 'axios';
import type { PassiveModule, ModuleResult } from '@/types';

export interface WhoisResult {
  domain_name: string;
  nameservers: string[];
  registrar: string;
  creation_date: string;
  expiration_date: string;
  remaining_time_in_days: number | string;
  status: string;
}

export const whois: PassiveModule = {
  name: 'whois',
  async run(target: string): Promise<ModuleResult<WhoisResult>> {
    try {
      const domain = target.replace(/^https?:\/\//, '').split('/')[0];
      const url = `https://rdap.verisign.com/com/v1/domain/${domain}`;

      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        const data = response.data as Record<string, unknown>;
        const events = (data.events as Array<Record<string, string>>) || [{}];
        const rawCreation = events[0]?.eventDate || 'N/A';
        const rawExpiration = events[1]?.eventDate || 'N/A';

        let remainingDays: number | string = 'N/A';
        let creationHuman = 'N/A';
        let expirationHuman = 'N/A';

        if (rawExpiration !== 'N/A') {
          const dtExp = new Date(rawExpiration.slice(0, 10));
          const now = new Date();
          remainingDays = Math.floor((dtExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expirationHuman = dtExp.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          });
        }

        if (rawCreation !== 'N/A') {
          const dtCrea = new Date(rawCreation.slice(0, 10));
          creationHuman = dtCrea.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          });
        }

        const nameservers = ((data.nameservers as Array<Record<string, string>>) || []).map(ns =>
          ns.ldhName.toLowerCase()
        );
        const entities = (data.entities as Array<Record<string, unknown>>) || [];
        const registrar = (entities[0]?.links as Array<Record<string, string>>)?.[0]?.href || 'N/A';

        return {
          success: true,
          data: {
            domain_name: (data.ldhName as string) || 'N/A',
            nameservers,
            registrar,
            creation_date: creationHuman,
            expiration_date: expirationHuman,
            remaining_time_in_days: remainingDays,
            status: ((data.status as string[]) || [])[0] || 'N/A',
          },
        };
      } else if (response.status === 404) {
        return { success: false, error: `The domain '${domain}' was not found.` };
      } else {
        return {
          success: false,
          error: `Error retrieving data. Status code: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
