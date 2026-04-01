import { program } from 'commander';
import * as passiveModules from '@/modules/passive';
import * as activeModules from '@/modules/active';
import { getHtml } from '@/utils/get_html';
import type { Results, ScanOutput, SharedHtmlData } from '@/types';

const VERSION = '0.0.1';

function normalizeUrl(input: string): string {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://${input}`;
  }
  return input;
}

async function runModules() {
  const opts = program.opts();

  let target = program.args[0];
  if (!target) {
    console.error('Error: Target is required');
    process.exit(1);
  }

  target = normalizeUrl(target);

  const passiveFlags = ['whois', 'mx', 'subdomains', 'geo'];
  const activeFlags = [
    'headers',
    'tech',
    'wplugins',
    'ssl',
    'os',
    'metadata',
    'emails',
    'phones',
    'sitemap',
    'robots',
    'social',
  ];

  const selectedPassive = passiveFlags.filter(flag => opts[flag]);
  const selectedActive = activeFlags.filter(flag => opts[flag]);

  const hasSpecificFlags = selectedPassive.length > 0 || selectedActive.length > 0;
  const runHybrid = opts.hybrid === true;
  const runPassiveOnly = opts.passive === true;

  const runActive = runHybrid || (hasSpecificFlags && selectedActive.length > 0);

  if (!runPassiveOnly && !runHybrid && !hasSpecificFlags) {
    console.error('Error: Specify at least one module or use -H for hybrid mode');
    console.error(
      'Use -H to run all modules, -P for passive only, or specific flags like -w, -i, etc.'
    );
    process.exit(1);
  }

  let sharedHtmlData: SharedHtmlData | undefined;
  if (runActive) {
    sharedHtmlData = await getHtml(target);
  }

  const results: Partial<Results> = {};

  const runPassiveModules = async (moduleNames: string[]) => {
    for (const moduleName of moduleNames) {
      const mod = passiveModules[moduleName as keyof typeof passiveModules];
      if (mod?.run) {
        try {
          const result = await mod.run(target);
          (results as Record<string, unknown>)[moduleName] = result;
        } catch (error) {
          (results as Record<string, unknown>)[moduleName] = {
            success: false,
            error: String(error),
          };
        }
      }
    }
  };

  const runActiveModules = async (moduleNames: string[]) => {
    for (const moduleName of moduleNames) {
      const mod = activeModules[moduleName as keyof typeof activeModules];
      if (mod?.run) {
        try {
          const result = await mod.run(target, sharedHtmlData);
          (results as Record<string, unknown>)[moduleName] = result;
        } catch (error) {
          (results as Record<string, unknown>)[moduleName] = {
            success: false,
            error: String(error),
          };
        }
      }
    }
  };

  if (runPassiveOnly) {
    await runPassiveModules(passiveFlags);
  } else if (runHybrid) {
    await runPassiveModules(passiveFlags);
    await runActiveModules(activeFlags);
  } else if (hasSpecificFlags) {
    await runPassiveModules(selectedPassive);
    await runActiveModules(selectedActive);
  }

  const output: ScanOutput = { target, results: results as Results };
  console.log(JSON.stringify(output, null, 2));
}

program
  .name('xrecon')
  .description(
    'OSINT CLI tool for web reconnaissance - gather passive and active information about websites.'
  )
  .version(VERSION)
  .argument('<target>', 'Target URL or domain')
  .option('-H, --hybrid', 'Run both active and passive modules')
  .option('-P, --passive', 'Run only passive modules')
  .option('-oN, --output <file>', 'Save output to file')
  .option('-w, --whois', 'Domain registration info via RDAP (passive)')
  .option('-m, --mx', 'MX records (passive)')
  .option('-S, --subdomains', 'Find subdomains (passive)')
  .option('-h, --headers', 'HTTP headers (active)')
  .option('-T, --tech', 'Detect technologies (active)')
  .option('-W, --wplugins', 'WordPress plugins (active)')
  .option('-s, --ssl', 'SSL certificate info (active)')
  .option('-g, --geo', 'Geolocation (active)')
  .option('-O, --os', 'OS detection via TTL (active)')
  .option('-i, --metadata', 'Page title and meta description (active)')
  .option('-e, --emails', 'Extract emails (active)')
  .option('-p, --phones', 'Extract phone numbers (active)')
  .option('-M, --sitemap', 'Sitemap URLs (active)')
  .option('-r, --robots', 'Robots.txt (active)')
  .option('-l, --social', 'Social networks (active)');

program.parse(process.argv);

runModules();
