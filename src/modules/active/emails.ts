import type { ActiveModule, ModuleResult, SharedHtmlData, EmailResult } from '@/types';

export const emails: ActiveModule = {
  name: 'emails',
  async run(_target: string, sharedData: SharedHtmlData): Promise<ModuleResult<EmailResult>> {
    try {
      const { html, $ } = sharedData;

      const pattern =
        /[a-zA-Z0-9._%+-]+@(?!.*(?:\.png|\.webp|\.jpg|\.jpeg|\.gif|\.svg))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

      const emails = new Set<string>();

      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(email => {
          const cleanEmail = email.toLowerCase().trim();
          if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
            emails.add(cleanEmail);
          }
        });
      }

      $('a[href^="mailto:"]').each((_i, element) => {
        const href = $(element).attr('href');
        if (href) {
          const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
          if (email && email.includes('@') && email.includes('.')) {
            emails.add(email);
          }
        }
      });

      const sortedEmails = Array.from(emails).sort();

      return { success: true, data: sortedEmails };
    } catch {
      return { success: false, data: [] };
    }
  },
};
