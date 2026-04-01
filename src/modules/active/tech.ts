import axios from 'axios';
import type { ActiveModule, ModuleResult } from '@/types';

interface TechDetection {
  name: string;
  category: string;
  evidence: string;
}

const TECH_SIGNATURES: Array<{ pattern: RegExp; name: string; category: string }> = [
  { pattern: /wordpress/i, name: 'WordPress', category: 'CMS' },
  { pattern: /drupal/i, name: 'Drupal', category: 'CMS' },
  { pattern: /joomla/i, name: 'Joomla', category: 'CMS' },
  { pattern: /shopify/i, name: 'Shopify', category: 'E-Commerce' },
  { pattern: /magento/i, name: 'Magento', category: 'E-Commerce' },
  { pattern: /wix/i, name: 'Wix', category: 'CMS' },
  { pattern: /squarespace/i, name: 'Squarespace', category: 'CMS' },
  { pattern: /gatsby/i, name: 'Gatsby', category: 'Framework' },
  { pattern: /next\.js/i, name: 'Next.js', category: 'Framework' },
  { pattern: /nuxt/i, name: 'Nuxt.js', category: 'Framework' },
  { pattern: /react/i, name: 'React', category: 'JavaScript' },
  { pattern: /vue\.js/i, name: 'Vue.js', category: 'JavaScript' },
  { pattern: /angular/i, name: 'Angular', category: 'JavaScript' },
  { pattern: /express/i, name: 'Express', category: 'Backend' },
  { pattern: /django/i, name: 'Django', category: 'Backend' },
  { pattern: /flask/i, name: 'Flask', category: 'Backend' },
  { pattern: /laravel/i, name: 'Laravel', category: 'Backend' },
  { pattern: /spring/i, name: 'Spring', category: 'Backend' },
  { pattern: /asp\.net/i, name: 'ASP.NET', category: 'Backend' },
  { pattern: /nginx/i, name: 'Nginx', category: 'Server' },
  { pattern: /apache/i, name: 'Apache', category: 'Server' },
  { pattern: /cloudflare/i, name: 'Cloudflare', category: 'CDN' },
  { pattern: /aws/i, name: 'AWS', category: 'Cloud' },
  { pattern: /google cloud/i, name: 'Google Cloud', category: 'Cloud' },
  { pattern: /azure/i, name: 'Azure', category: 'Cloud' },
];

export const tech: ActiveModule = {
  name: 'tech',
  async run(target: string): Promise<ModuleResult<TechDetection[]>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
      const url = `https://${hostname}`;

      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      const headers = response.headers;
      const html = response.data as string;
      const detected: TechDetection[] = [];

      const serverHeader = headers['server'] as string;
      const poweredBy = headers['x-powered-by'] as string;
      const cfRAY = headers['cf-ray'] as string;

      if (serverHeader) {
        for (const sig of TECH_SIGNATURES) {
          if (sig.category === 'Server' && sig.pattern.test(serverHeader)) {
            detected.push({
              name: sig.name,
              category: sig.category,
              evidence: `Server: ${serverHeader}`,
            });
            break;
          }
        }
      }

      if (poweredBy) {
        for (const sig of TECH_SIGNATURES) {
          if (sig.pattern.test(poweredBy)) {
            detected.push({
              name: sig.name,
              category: sig.category,
              evidence: `X-Powered-By: ${poweredBy}`,
            });
            break;
          }
        }
      }

      if (cfRAY) {
        detected.push({
          name: 'Cloudflare',
          category: 'CDN',
          evidence: 'CF-RAY header present',
        });
      }

      for (const sig of TECH_SIGNATURES) {
        if (sig.category === 'Server' || sig.category === 'CDN') continue;
        if (sig.pattern.test(html)) {
          const exists = detected.some(t => t.name === sig.name);
          if (!exists) {
            detected.push({
              name: sig.name,
              category: sig.category,
              evidence: 'Found in HTML',
            });
          }
        }
      }

      return { success: true, data: detected };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
