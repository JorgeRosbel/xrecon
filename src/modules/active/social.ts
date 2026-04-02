import type { ActiveModule, ModuleResult, SharedHtmlData, SocialResult } from '@/types';
import { getHtml } from '@/utils/get_html';

const SOCIAL_PATTERNS: Record<string, string[]> = {
  facebook: ['facebook\\.com/[\\w.-]+', 'fb\\.com/[\\w.-]+'],
  twitter: ['twitter\\.com/[\\w.-]+', 'x\\.com/[\\w.-]+'],
  instagram: ['instagram\\.com/[\\w.-]+'],
  linkedin: ['linkedin\\.com/(?:company|in|school)/[\\w.-]+'],
  youtube: ['youtube\\.com/(?:channel|c|user|@)[\\w.-]+', 'youtu\\.be/[\\w.-]+'],
  tiktok: ['tiktok\\.com/@[\\w.-]+'],
  pinterest: ['pinterest\\.com/[\\w.-]+'],
  reddit: ['reddit\\.com/(?:u|user)/[\\w.-]+', 'reddit\\.com/r/[\\w.-]+'],
  github: ['github\\.com/[\\w.-]+'],
  mastodon: ['mastodon\\.social/@[\\w.-]+', '[\\w.-]+\\.mastodon\\..+/@[\\w.-]+'],
};

export const social: ActiveModule = {
  name: 'social',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<SocialResult>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const { html, $ } = data;
      const found: Record<string, string[]> = {};

      for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
        for (const pattern of patterns) {
          const regex = new RegExp(`https?://${pattern}`, 'gi');
          const matches = html.match(regex);
          if (matches) {
            const unique = [...new Set(matches)];
            if (!found[platform]) {
              found[platform] = unique;
            } else {
              found[platform].push(...unique);
            }
          }
        }
      }

      $('a[href]').each((_i, element) => {
        const href = $(element).attr('href') || '';
        for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(href)) {
              const fullUrl = href.startsWith('http') ? href : `https://${href}`;
              if (!found[platform]) {
                found[platform] = [fullUrl];
              } else if (!found[platform].includes(fullUrl)) {
                found[platform].push(fullUrl);
              }
            }
          }
        }
      });

      const result: SocialResult = {};
      for (const [platform, urls] of Object.entries(found)) {
        const uniqueUrls = [...new Set(urls)].slice(0, 3) as string[];
        result[platform as keyof SocialResult] = uniqueUrls;
      }

      return { success: true, data: result };
    } catch {
      return { success: false, data: {} };
    }
  },
};
