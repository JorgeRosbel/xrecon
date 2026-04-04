import chalk from 'chalk';
import boxen from 'boxen';
import Fuse from 'fuse.js';

export interface ModuleInfo {
  name: string;
  flag: string;
  longFlag: string;
  description: string;
  type: 'passive' | 'active' | 'global';
  whenToUse?: string;
  example?: string;
}

const MODULES: ModuleInfo[] = [
  {
    name: 'whois',
    flag: '-w',
    longFlag: '--whois',
    description: 'Domain registration info via RDAP',
    type: 'passive',
    whenToUse:
      'Use this to discover who owns a domain, when it expires, and their contact information. Essential for initial reconnaissance and verifying domain legitimacy before deeper investigation.',
    example: 'xrecon example.com -w -oJ whois.json',
  },
  {
    name: 'mx',
    flag: '-m',
    longFlag: '--mx',
    description: 'MX records',
    type: 'passive',
    whenToUse:
      'Use this to find the mail servers handling email for a domain. Helpful for identifying potential email gateways, testing mail relay configuration, and understanding a targets communication infrastructure.',
    example: 'xrecon example.com -m',
  },
  {
    name: 'txt',
    flag: '-t',
    longFlag: '--txt',
    description: 'TXT records - SPF, DKIM',
    type: 'passive',
    whenToUse:
      'Use this to discover SPF, DKIM, and DMARC records that verify email authenticity. Essential for identifying email security configuration and potential vulnerabilities in email delivery.',
    example: 'xrecon example.com -t',
  },
  {
    name: 'subdomains',
    flag: '-S',
    longFlag: '--subdomains',
    description: 'Find subdomains',
    type: 'passive',
    whenToUse:
      'Use this to discover subdomains associated with the main domain. Critical for mapping the full attack surface, finding hidden development/staging environments, and discovering overlooked services.',
    example: 'xrecon example.com -S -oJ subdomains.json',
  },
  {
    name: 'geo',
    flag: '-g',
    longFlag: '--geo',
    description: 'Geolocation',
    type: 'passive',
    whenToUse:
      'Use this to discover the physical location and ISP information of a domain. Useful for understanding the targets infrastructure, identifying hosting providers, and geolocation requirements.',
    example: 'xrecon example.com -g',
  },
  {
    name: 'headers',
    flag: '-h',
    longFlag: '--headers',
    description: 'HTTP headers',
    type: 'active',
    whenToUse:
      'Use this to analyze all HTTP headers returned by the server. Reveals server type, caching policies, security headers, technology hints, and configuration details that aid in fingerprinting.',
    example: 'xrecon example.com -h',
  },
  {
    name: 'security',
    flag: '-c',
    longFlag: '--security',
    description: 'Security headers',
    type: 'active',
    whenToUse:
      'Use this to evaluate the security posture by checking for missing or misconfigured security headers. Identifies gaps in protections like X-Frame-Options, CSP, HSTS, and helps recommend security improvements.',
    example: 'xrecon example.com -c -oJ security.json',
  },
  {
    name: 'tech',
    flag: '-T',
    longFlag: '--tech',
    description: 'Detect technologies',
    type: 'active',
    whenToUse:
      'Use this to discover what technologies, frameworks, and services a website uses. Essential for understanding the tech stack, identifying potential vulnerabilities, and planning targeted attacks.',
    example: 'xrecon example.com -T -oJ tech.json',
  },
  {
    name: 'wplugins',
    flag: '-W',
    longFlag: '--wplugins',
    description: 'WordPress plugins',
    type: 'active',
    whenToUse:
      'Use this to identify installed WordPress plugins. Critical for WordPress security assessments as outdated or vulnerable plugins are a common attack vector. Always combine with -T for complete tech stack.',
    example: 'xrecon example.com -T -W',
  },
  {
    name: 'ssl',
    flag: '-s',
    longFlag: '--ssl',
    description: 'SSL certificate info',
    type: 'active',
    whenToUse:
      'Use this to analyze SSL/TLS certificate details including issuer, validity dates, and certificate chain. Essential for identifying expired certificates, weak encryption, and certificate misconfigurations.',
    example: 'xrecon example.com -s -oJ ssl.json',
  },
  {
    name: 'os',
    flag: '-O',
    longFlag: '--os',
    description: 'OS detection via TTL',
    type: 'active',
    whenToUse:
      'Use this to identify the target operating system by analyzing TTL values in responses. Useful for fingerprinting infrastructure and preparing OS-specific exploits or attacks.',
    example: 'xrecon example.com -O',
  },
  {
    name: 'metadata',
    flag: '-i',
    longFlag: '--metadata',
    description: 'Page title and meta description',
    type: 'active',
    whenToUse:
      'Use this to extract the page title and meta description. Quick way to understand what a page is about, useful for quick reconnaissance and identifying the nature of specific endpoints.',
    example: 'xrecon example.com -i',
  },
  {
    name: 'comments',
    flag: '-C',
    longFlag: '--comments',
    description: 'Extract HTML comments',
    type: 'active',
    whenToUse:
      'Use this to find hidden comments in HTML source code. Often reveals developer notes, debugging info, temporary code, credentials, or internal URLs that should not be publicly accessible.',
    example: 'xrecon example.com -C',
  },
  {
    name: 'scripts',
    flag: '-J',
    longFlag: '--scripts',
    description: 'Extract JavaScript file URLs',
    type: 'active',
    whenToUse:
      'Use this to discover all JavaScript files loaded by the page. Essential for further analysis of JS secrets, endpoints, and understanding client-side functionality. Often reveals API endpoints and logic.',
    example: 'xrecon example.com -J -oJ scripts.json',
  },
  {
    name: 'emails',
    flag: '-e',
    longFlag: '--emails',
    description: 'Extract emails',
    type: 'active',
    whenToUse:
      'Use this to find email addresses exposed on the website. Useful forOSINT gathering, identifying contact points, and mapping organizational email patterns for further investigation.',
    example: 'xrecon example.com -e',
  },
  {
    name: 'phones',
    flag: '-p',
    longFlag: '--phones',
    description: 'Extract phone numbers',
    type: 'active',
    whenToUse:
      'Use this to discover phone numbers exposed on the website. Useful forOSINT, identifying contact centers, and gathering information about organizational structure and locations.',
    example: 'xrecon example.com -p',
  },
  {
    name: 'sitemap',
    flag: '-M',
    longFlag: '--sitemap',
    description: 'Sitemap URLs',
    type: 'active',
    whenToUse:
      'Use this to discover sitemap files and their URLs. Essential for mapping the entire site structure, finding hidden pages, understanding site architecture, and discovering administrative interfaces.',
    example: 'xrecon example.com -M -oJ sitemap.json',
  },
  {
    name: 'robots',
    flag: '-r',
    longFlag: '--robots',
    description: 'Robots.txt',
    type: 'active',
    whenToUse:
      'Use this to analyze robots.txt file. Reveals disallowed paths, sitemap locations, and areas the owner wants to hide from search engines. Often reveals admin panels, temp files, and sensitive directories.',
    example: 'xrecon example.com -r',
  },
  {
    name: 'social',
    flag: '-l',
    longFlag: '--social',
    description: 'Social networks',
    type: 'active',
    whenToUse:
      'Use this to find social media profiles and links mentioned on the website. Useful forOSINT, mapping organizational presence, and correlating information across platforms for complete reconnaissance.',
    example: 'xrecon example.com -l -oJ social.json',
  },
  {
    name: 'routes',
    flag: '-R',
    longFlag: '--routes',
    description: 'Public routes from sitemaps',
    type: 'active',
    whenToUse:
      'Use this to extract all URLs from sitemaps and discover hidden routes. Powerful for mapping application structure, finding API endpoints, and discovering pages not linked from the main navigation.',
    example: 'xrecon example.com -R -oJ routes.json',
  },
  {
    name: 'cookies',
    flag: '-k',
    longFlag: '--cookies',
    description: 'Detect cookies',
    type: 'active',
    whenToUse:
      'Use this to identify cookies set by the website. Reveals session identifiers, tracking scripts, authentication tokens, and helps understand how the site tracks users and maintains sessions.',
    example: 'xrecon example.com -k -oJ cookies.json',
  },
  {
    name: 'storage',
    flag: '-K',
    longFlag: '--storage',
    description: 'Extract localStorage/sessionStorage and JWT tokens',
    type: 'active',
    whenToUse:
      'Use this to extract data stored in browser localStorage and sessionStorage. Particularly useful for finding JWT tokens, session data, API keys, and understanding client-side data persistence mechanisms.',
    example: 'xrecon example.com -K -oJ storage.json',
  },
  {
    name: 'jssecrets',
    flag: '-X',
    longFlag: '--jssecrets',
    description: 'Scan JS files for secrets and sensitive data',
    type: 'active',
    whenToUse:
      'Use this to scan JavaScript files for exposed secrets like API keys, tokens, passwords, and credentials. Critical finding that often leads to account takeover, API abuse, or deeper system access.',
    example: 'xrecon example.com -X -oJ jssecrets.json',
  },
  {
    name: 'endpoints',
    flag: '-E',
    longFlag: '--endpoints',
    description: 'Extract API endpoints from JS files and forms',
    type: 'active',
    whenToUse:
      'Use this to discover API endpoints by analyzing JavaScript files and HTML forms. Essential for understanding the backend API structure, identifying available services, and planning API attacks.',
    example: 'xrecon example.com -E -oJ endpoints.json',
  },
  {
    name: 'hybrid',
    flag: '-H',
    longFlag: '--hybrid',
    description: 'Run both active and passive modules',
    type: 'global',
    whenToUse:
      'Use this to run a comprehensive scan combining all passive and active modules. Recommended for complete reconnaissance when you need the full picture of a target without specifying individual modules.',
    example: 'xrecon example.com -H -oJ full-scan.json',
  },
  {
    name: 'passive',
    flag: '-P',
    longFlag: '--passive',
    description: 'Run only passive modules',
    type: 'global',
    whenToUse:
      'Use this to run only passive modules that do not directly interact with the target. Perfect for stealthy reconnaissance where you want to gather information without being detected.',
    example: 'xrecon example.com -P -oJ passive.json',
  },
  {
    name: 'proxy',
    flag: '-x',
    longFlag: '--proxy',
    description: 'HTTP/SOCKS proxy URL',
    type: 'global',
    whenToUse:
      'Use this to route all HTTP requests through a proxy server. Essential for maintaining anonymity during reconnaissance, bypassing IP rate limits, or testing from different geographic locations.',
    example: 'xrecon example.com -H -x http://proxy.example.com:8080',
  },
  {
    name: 'proxy-auth',
    flag: '-a',
    longFlag: '--proxy-auth',
    description: 'Proxy authentication',
    type: 'global',
    whenToUse:
      'Use this to provide authentication credentials for proxy servers that require it. Required when using private or corporate proxies that enforce authentication for access.',
    example: 'xrecon example.com -H -x http://proxy.example.com:8080 -a user:password',
  },
  {
    name: 'output',
    flag: '-oN',
    longFlag: '--output',
    description: 'Save output to file (plain text)',
    type: 'global',
    whenToUse:
      'Use this to save scan results as plain text to a file. Useful for quick reviews, sharing with team members, or saving output for later analysis without JSON overhead.',
    example: 'xrecon example.com -H -oN results.txt',
  },
  {
    name: 'output-json',
    flag: '-oJ',
    longFlag: '--output-json',
    description: 'Save output as JSON file',
    type: 'global',
    whenToUse:
      'Use this to save scan results in JSON format. Ideal for programmatic consumption, integration with other tools, or storing structured data for automated processing.',
    example: 'xrecon example.com -H -oJ results.json',
  },
  {
    name: 'output-html',
    flag: '-oH',
    longFlag: '--output-html',
    description: 'Save output as HTML file',
    type: 'global',
    whenToUse:
      'Use this to generate an HTML report of scan results. Perfect for sharing visually appealing reports with stakeholders or clients who prefer formatted documentation.',
    example: 'xrecon example.com -H -oH report.html',
  },
];

const fuse = new Fuse(MODULES, {
  keys: ['name', 'description', 'type'],
  threshold: 0.4,
  includeScore: true,
});

function wrapText(text: string, width = 60): string {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= width) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.join('\n   ');
}

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
    const typeLabel =
      mod.type === 'passive'
        ? chalk.blue('[PASSIVE]')
        : mod.type === 'active'
          ? chalk.cyan('[ACTIVE]')
          : chalk.yellow('[GLOBAL]');

    console.log(`${chalk.bold(idx + 1 + '.')} ${chalk.bold(mod.name)} ${typeLabel}`);
    console.log(`   ${chalk.gray('Flag:')} ${chalk.green(mod.flag)}, ${chalk.green(mod.longFlag)}`);
    console.log(`   ${chalk.gray('Description:')} ${mod.description}`);
    if (mod.whenToUse) {
      const wrappedWhen = wrapText(mod.whenToUse, 55);
      console.log(`   ${chalk.gray('When to use:')} ${wrappedWhen}`);
    }
    if (mod.example) {
      console.log(`   ${chalk.gray('Example:')} ${chalk.cyan(mod.example)}`);
    }
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
  const global = MODULES.filter(m => m.type === 'global');

  const header = boxen(
    `${chalk.bold.cyan('📋 All Modules')}\n\n` +
      `${chalk.gray('Total:')} ${MODULES.length} entries (${passive.length} passive, ${active.length} active, ${global.length} global)`,
    { padding: 1, borderStyle: 'round', borderColor: 'cyan', titleAlignment: 'center' }
  );

  console.log(header + '\n');

  console.log(chalk.bold.underline('Passive Modules'));
  passive.forEach(mod => {
    console.log(`  ${chalk.green(mod.flag)} ${chalk.bold(mod.name)} - ${mod.description}`);
    console.log(`     ${chalk.gray('When:')} ${mod.whenToUse?.slice(0, 60)}...`);
    console.log(`     ${chalk.gray('Ex:')} ${chalk.cyan(mod.example)}`);
    console.log('');
  });

  console.log(chalk.bold.underline('Active Modules'));
  active.forEach(mod => {
    console.log(`  ${chalk.green(mod.flag)} ${chalk.bold(mod.name)} - ${mod.description}`);
    console.log(`     ${chalk.gray('When:')} ${mod.whenToUse?.slice(0, 60)}...`);
    console.log(`     ${chalk.gray('Ex:')} ${chalk.cyan(mod.example)}`);
    console.log('');
  });

  console.log(chalk.bold.underline('Global Options'));
  global.forEach(opt => {
    console.log(`  ${chalk.green(opt.flag)} ${chalk.bold(opt.name)} - ${opt.description}`);
    console.log(`     ${chalk.gray('When:')} ${opt.whenToUse?.slice(0, 60)}...`);
    console.log(`     ${chalk.gray('Ex:')} ${chalk.cyan(opt.example)}`);
    console.log('');
  });

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  Use: xrecon search <keyword> to find modules'));
}
