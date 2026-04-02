import chalk from 'chalk';
import boxen from 'boxen';
import Fuse from 'fuse.js';

export interface ModuleInfo {
  name: string;
  flag: string;
  longFlag: string;
  description: string;
  type: 'passive' | 'active';
}

const MODULES: ModuleInfo[] = [
  {
    name: 'whois',
    flag: '-w',
    longFlag: '--whois',
    description: 'Domain registration info via RDAP',
    type: 'passive',
  },
  { name: 'mx', flag: '-m', longFlag: '--mx', description: 'MX records', type: 'passive' },
  {
    name: 'txt',
    flag: '-t',
    longFlag: '--txt',
    description: 'TXT records - SPF, DKIM',
    type: 'passive',
  },
  {
    name: 'subdomains',
    flag: '-S',
    longFlag: '--subdomains',
    description: 'Find subdomains',
    type: 'passive',
  },
  { name: 'geo', flag: '-g', longFlag: '--geo', description: 'Geolocation', type: 'passive' },
  {
    name: 'headers',
    flag: '-h',
    longFlag: '--headers',
    description: 'HTTP headers',
    type: 'active',
  },
  {
    name: 'security',
    flag: '-c',
    longFlag: '--security',
    description: 'Security headers',
    type: 'active',
  },
  {
    name: 'tech',
    flag: '-T',
    longFlag: '--tech',
    description: 'Detect technologies',
    type: 'active',
  },
  {
    name: 'wplugins',
    flag: '-W',
    longFlag: '--wplugins',
    description: 'WordPress plugins',
    type: 'active',
  },
  {
    name: 'ssl',
    flag: '-s',
    longFlag: '--ssl',
    description: 'SSL certificate info',
    type: 'active',
  },
  { name: 'os', flag: '-O', longFlag: '--os', description: 'OS detection via TTL', type: 'active' },
  {
    name: 'metadata',
    flag: '-i',
    longFlag: '--metadata',
    description: 'Page title and meta description',
    type: 'active',
  },
  {
    name: 'comments',
    flag: '-C',
    longFlag: '--comments',
    description: 'Extract HTML comments',
    type: 'active',
  },
  {
    name: 'scripts',
    flag: '-J',
    longFlag: '--scripts',
    description: 'Extract JavaScript file URLs',
    type: 'active',
  },
  {
    name: 'emails',
    flag: '-e',
    longFlag: '--emails',
    description: 'Extract emails',
    type: 'active',
  },
  {
    name: 'phones',
    flag: '-p',
    longFlag: '--phones',
    description: 'Extract phone numbers',
    type: 'active',
  },
  {
    name: 'sitemap',
    flag: '-M',
    longFlag: '--sitemap',
    description: 'Sitemap URLs',
    type: 'active',
  },
  { name: 'robots', flag: '-r', longFlag: '--robots', description: 'Robots.txt', type: 'active' },
  {
    name: 'social',
    flag: '-l',
    longFlag: '--social',
    description: 'Social networks',
    type: 'active',
  },
  {
    name: 'routes',
    flag: '-R',
    longFlag: '--routes',
    description: 'Public routes from sitemaps',
    type: 'active',
  },
  {
    name: 'cookies',
    flag: '-k',
    longFlag: '--cookies',
    description: 'Detect cookies',
    type: 'active',
  },
  {
    name: 'storage',
    flag: '-K',
    longFlag: '--storage',
    description: 'Extract localStorage/sessionStorage and JWT tokens',
    type: 'active',
  },
];

const fuse = new Fuse(MODULES, {
  keys: ['name', 'description', 'type'],
  threshold: 0.4,
  includeScore: true,
});

export function searchModules(query: string, limit = 10): ModuleInfo[] {
  const results = fuse.search(query);
  return results.slice(0, limit).map(r => r.item);
}

export function displaySearchResults(query: string, results: ModuleInfo[]): void {
  if (results.length === 0) {
    console.log(
      boxen(
        `${chalk.yellow('No modules found for:')} "${query}"\n` +
          chalk.gray('Try different keywords like: tech, security, email, wordpress'),
        { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
      )
    );
    return;
  }

  const header = boxen(
    `${chalk.bold.cyan('🔍 Search Results')}\n\n` +
      `${chalk.gray('Query:')} ${query}\n` +
      `${chalk.gray('Found:')} ${results.length} module(s)`,
    { padding: 1, borderStyle: 'round', borderColor: 'cyan', titleAlignment: 'center' }
  );

  console.log(header + '\n');

  results.forEach((mod, idx) => {
    const typeLabel = mod.type === 'passive' ? chalk.blue('[PASSIVE]') : chalk.cyan('[ACTIVE]');

    console.log(`${chalk.bold(idx + 1 + '.')} ${chalk.bold(mod.name)} ${typeLabel}`);
    console.log(`   ${chalk.gray('Flag:')} ${chalk.green(mod.flag)}, ${chalk.green(mod.longFlag)}`);
    console.log(`   ${chalk.gray('Description:')} ${mod.description}`);
    console.log(
      `   ${chalk.gray('Usage:')} ${chalk.cyan('xrecon example.com')} ${chalk.green(mod.flag)}`
    );
    console.log('');
  });

  console.log(chalk.gray('─'.repeat(50)));
}

export function listAllModules(): void {
  const passive = MODULES.filter(m => m.type === 'passive');
  const active = MODULES.filter(m => m.type === 'active');

  const header = boxen(
    `${chalk.bold.cyan('📋 All Modules')}\n\n` +
      `${chalk.gray('Total:')} ${MODULES.length} modules (${passive.length} passive, ${active.length} active)`,
    { padding: 1, borderStyle: 'round', borderColor: 'cyan', titleAlignment: 'center' }
  );

  console.log(header + '\n');

  console.log(chalk.bold.underline('Passive Modules'));
  passive.forEach(mod => {
    console.log(`  ${chalk.green(mod.flag)} ${mod.name} - ${mod.description}`);
  });

  console.log('\n' + chalk.bold.underline('Active Modules'));
  active.forEach(mod => {
    console.log(`  ${chalk.green(mod.flag)} ${mod.name} - ${mod.description}`);
  });

  console.log('\n' + chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  Use: xrecon search <keyword> to find modules'));
}
