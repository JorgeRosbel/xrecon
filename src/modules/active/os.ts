import axios from 'axios';
import type { ActiveModule, ModuleResult } from '@/types';

export interface OSResult {
  os: string;
  evidence: string;
}

export const os: ActiveModule = {
  name: 'os',
  async run(target: string): Promise<ModuleResult<OSResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];

      let response;
      try {
        response = await axios.head(`https://${hostname}`, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch {
        response = await axios.head(`http://${hostname}`, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      const serverHeader = response.headers['server'] as string;
      let detectedOS = 'Unknown';
      let evidence = '';

      if (serverHeader) {
        const server = serverHeader.toLowerCase();
        if (server.includes('ubuntu') || server.includes('debian')) {
          detectedOS = 'Linux (Ubuntu/Debian)';
          evidence = `Server: ${serverHeader}`;
        } else if (
          server.includes('centos') ||
          server.includes('red hat') ||
          server.includes('fedora')
        ) {
          detectedOS = 'Linux (RHEL/CentOS/Fedora)';
          evidence = `Server: ${serverHeader}`;
        } else if (server.includes('alpine')) {
          detectedOS = 'Linux (Alpine)';
          evidence = `Server: ${serverHeader}`;
        } else if (server.includes('freebsd') || server.includes('openbsd')) {
          detectedOS = 'BSD';
          evidence = `Server: ${serverHeader}`;
        } else if (server.includes('windows') || server.includes('iis')) {
          detectedOS = 'Windows';
          evidence = `Server: ${serverHeader}`;
        } else if (server.includes('nginx')) {
          detectedOS = 'Linux (likely)';
          evidence = `Server: ${serverHeader}`;
        } else if (server.includes('apache')) {
          detectedOS = 'Linux/Unix (likely)';
          evidence = `Server: ${serverHeader}`;
        }
      }

      if (detectedOS === 'Unknown') {
        evidence = 'No OS indicators found in headers';
      }

      return { success: true, data: { os: detectedOS, evidence } };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
