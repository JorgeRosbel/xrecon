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

  const passiveFlags = ['whois', 'mx', 'txt', 'subdomains', 'geo'];
  const activeFlags = [
    'headers',
    'security',
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
  .option('-w, --whois', 'Domain registration info via RDAP [PASSIVE]')
  .option('-m, --mx', 'MX records [PASSIVE]')
  .option('-t, --txt', 'TXT records - SPF, DKIM [PASSIVE]')
  .option('-S, --subdomains', 'Find subdomains [PASSIVE]')
  .option('-h, --headers', 'HTTP headers [ACTIVE]')
  .option('-c, --security', 'Security headers [ACTIVE]')
  .option('-T, --tech', 'Detect technologies [ACTIVE]')
  .option('-W, --wplugins', 'WordPress plugins [ACTIVE]')
  .option('-s, --ssl', 'SSL certificate info [ACTIVE]')
  .option('-g, --geo', 'Geolocation [PASSIVE]')
  .option('-O, --os', 'OS detection via TTL [ACTIVE]')
  .option('-i, --metadata', 'Page title and meta description [ACTIVE]')
  .option('-e, --emails', 'Extract emails [ACTIVE]')
  .option('-p, --phones', 'Extract phone numbers [ACTIVE]')
  .option('-M, --sitemap', 'Sitemap URLs [ACTIVE]')
  .option('-r, --robots', 'Robots.txt [ACTIVE]')
  .option('-l, --social', 'Social networks [ACTIVE]');

program.parse(process.argv);

runModules();
