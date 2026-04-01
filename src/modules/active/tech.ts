import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

interface TechDetection {
  name: string;
  category: string;
  evidence: string;
}

export const tech: ActiveModule = {
  name: 'tech',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<TechDetection[]>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const html = data.html;
      const htmlLower = html.toLowerCase();
      const detected: TechDetection[] = [];

      if (htmlLower.includes('_astro/')) {
        detected.push({ name: 'Astro', category: 'Framework', evidence: 'Found _astro/ in HTML' });
      }
      if (htmlLower.includes('gtag') || htmlLower.includes('google-analytics')) {
        detected.push({
          name: 'Google Analytics',
          category: 'Analytics',
          evidence: 'Found gtag/google-analytics in HTML',
        });
      }
      if (htmlLower.includes('elementor-section')) {
        detected.push({
          name: 'Elementor',
          category: 'WordPress Plugin',
          evidence: 'Found elementor-section in HTML',
        });
      }
      if (htmlLower.includes('https://www.googletagmanager.com')) {
        detected.push({
          name: 'Google Tag Manager',
          category: 'Analytics',
          evidence: 'Found googletagmanager in HTML',
        });
      }
      if (
        htmlLower.includes('text-') ||
        htmlLower.includes('bg-') ||
        htmlLower.includes('border-')
      ) {
        detected.push({
          name: 'Tailwind CSS',
          category: 'CSS',
          evidence: 'Found Tailwind utility classes in HTML',
        });
      }
      if (
        htmlLower.includes('wp-content') ||
        htmlLower.includes('wp-includes') ||
        htmlLower.includes('elementor/') ||
        htmlLower.includes('ver-wp')
      ) {
        detected.push({
          name: 'WordPress',
          category: 'CMS',
          evidence: 'Found WordPress indicators in HTML',
        });
      }
      if (
        htmlLower.includes('__next_f') ||
        htmlLower.includes('/_next/static') ||
        htmlLower.includes('next-hal-stack')
      ) {
        detected.push({
          name: 'Next.js',
          category: 'Framework',
          evidence: 'Found Next.js indicators in HTML',
        });
      }
      if (htmlLower.includes('data-shopify') || htmlLower.includes('cdn.shopify.com')) {
        detected.push({
          name: 'Shopify',
          category: 'E-Commerce',
          evidence: 'Found Shopify indicators in HTML',
        });
      }
      if (
        htmlLower.includes("id='root'") ||
        htmlLower.includes('id="root"') ||
        htmlLower.includes('react-dom') ||
        htmlLower.includes('__react') ||
        htmlLower.includes('data-reactroot')
      ) {
        detected.push({
          name: 'React',
          category: 'JavaScript',
          evidence: 'Found React indicators in HTML',
        });
      }
      if (htmlLower.includes('data-styled=') || htmlLower.includes('data-styled-components')) {
        detected.push({
          name: 'Styled Components',
          category: 'CSS',
          evidence: 'Found Styled Components indicators in HTML',
        });
      }
      if (htmlLower.includes('jquery')) {
        detected.push({ name: 'jQuery', category: 'JavaScript', evidence: 'Found jQuery in HTML' });
      }
      if (htmlLower.includes('bootstrap')) {
        detected.push({ name: 'Bootstrap', category: 'CSS', evidence: 'Found Bootstrap in HTML' });
      }
      if (htmlLower.includes('vue')) {
        detected.push({ name: 'Vue.js', category: 'JavaScript', evidence: 'Found Vue.js in HTML' });
      }

      if (detected.length === 0) {
        detected.push({
          name: 'Unknown',
          category: 'Unknown',
          evidence: 'No technologies detected',
        });
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
