import tls from 'tls';
import type { ActiveModule, ModuleResult, SSLResult } from '@/types';

function getCertField(field: string | string[] | undefined, fallback = 'Unknown'): string {
  if (Array.isArray(field)) {
    return field[0] || fallback;
  }
  return field || fallback;
}

export const ssl: ActiveModule = {
  name: 'ssl',
  async run(target: string): Promise<ModuleResult<SSLResult>> {
    return new Promise(resolve => {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];

      const socket = tls.connect(443, hostname, { servername: hostname }, () => {
        const cert = socket.getPeerCertificate(true);

        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          resolve({ success: false, error: 'No SSL certificate found' });
          return;
        }

        const issuer = getCertField(cert.issuer?.O) || getCertField(cert.issuer?.CN);
        const commonName = getCertField(cert.subject?.CN) || getCertField(cert.subject?.O);

        const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : 'Unknown';
        const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : 'Unknown';

        let daysLeft = 0;
        if (cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        socket.destroy();

        resolve({
          success: true,
          data: {
            commonName,
            issuer,
            validFrom,
            validTo,
            daysLeft,
          },
        });
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      socket.on('error', error => {
        resolve({
          success: false,
          error: `Error: ${error.message}`.slice(0, 50),
        });
      });
    });
  },
};
