import axios from 'axios';
import type { PassiveModule, ModuleResult, GeoResult } from '@/types';

export const geo: PassiveModule = {
  name: 'geo',
  async run(target: string): Promise<ModuleResult<GeoResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];

      const ipResponse = await axios.get(`https://dns.google/resolve?name=${hostname}&type=A`, {
        timeout: 10000,
      });

      const ip = ipResponse.data.Answer?.[0]?.data;

      if (!ip) {
        return { success: false, error: 'No IP found for hostname' };
      }

      const geoResponse = await axios.get(
        `http://ip-api.com/json/${ip}?fields=status,country,city,isp,query`,
        { timeout: 10000 }
      );

      const data = geoResponse.data;

      if (data.status === 'success') {
        return {
          success: true,
          data: {
            country: data.country || 'N/A',
            city: data.city || 'N/A',
            isp: data.isp || 'N/A',
            ip: data.query || ip,
          },
        };
      }

      return { success: false, error: 'Geo lookup failed' };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
