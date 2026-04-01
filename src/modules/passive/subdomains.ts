import axios from 'axios';
import type { PassiveModule, ModuleResult, SubdomainsResult } from '@/types';

async function findSubdomainsPassive(domain: string): Promise<Set<string>> {
  const subdomains = new Set<string>();

  try {
    const response = await axios.get(`https://crt.sh/?q=%25.${domain}&output=json`, {
      timeout: 25000,
    });

    const data = response.data;
    for (const entry of data) {
      const nameValue = entry.name_value.toLowerCase();
      for (const sub of nameValue.split('\n')) {
        const cleanSub = sub.replace('*.', '');
        if (cleanSub.endsWith(domain) && cleanSub !== domain) {
          subdomains.add(cleanSub);
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return subdomains;
}

async function searchHackerTarget(domain: string): Promise<Set<string>> {
  const subdomains = new Set<string>();

  try {
    const response = await axios.get(`https://api.hackertarget.com/hostsearch/?q=${domain}`, {
      timeout: 10000,
    });

    for (const line of response.data.split('\n')) {
      if (line.includes(',')) {
        const host = line.split(',')[0].toLowerCase();
        if (host.endsWith(domain) && host !== domain) {
          subdomains.add(host);
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return subdomains;
}

async function searchAlienVault(domain: string): Promise<Set<string>> {
  const subdomains = new Set<string>();

  try {
    const response = await axios.get(
      `https://otx.alienvault.com/api/v1/indicators/domain/${domain}/passive_dns`,
      { timeout: 15000 }
    );

    for (const record of response.data.passive_dns || []) {
      const hostname = (record.hostname || '').toLowerCase();
      if (hostname.endsWith(domain) && hostname !== domain) {
        subdomains.add(hostname);
      }
    }
  } catch {
    // Ignore errors
  }

  return subdomains;
}

export const subdomains: PassiveModule = {
  name: 'subdomains',
  async run(target: string): Promise<ModuleResult<SubdomainsResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const domain = hostname.replace(/^www\./, '');

      const allSubdomains = new Set<string>();

      const [crtSh, hackerTarget, alienVault] = await Promise.all([
        findSubdomainsPassive(domain),
        searchHackerTarget(domain),
        searchAlienVault(domain),
      ]);

      crtSh.forEach(s => allSubdomains.add(s));
      hackerTarget.forEach(s => allSubdomains.add(s));
      alienVault.forEach(s => allSubdomains.add(s));

      const result = Array.from(allSubdomains).sort().slice(0, 50);

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
