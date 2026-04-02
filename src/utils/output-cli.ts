import chalk from 'chalk';
import boxen from 'boxen';
import type { ModuleResult, Results } from '@/types';

interface FormattedModule {
  name: string;
  type: 'passive' | 'active';
  result: ModuleResult;
}

const MODULE_TYPES: Record<string, 'passive' | 'active'> = {
  whois: 'passive',
  mx: 'passive',
  txt: 'passive',
  subdomains: 'passive',
  geo: 'passive',
  headers: 'active',
  security: 'active',
  tech: 'active',
  wplugins: 'active',
  ssl: 'active',
  os: 'active',
  metadata: 'active',
  comments: 'active',
  scripts: 'active',
  emails: 'active',
  phones: 'active',
  sitemap: 'active',
  robots: 'active',
  social: 'active',
  routes: 'active',
  cookies: 'active',
  storage: 'active',
};

function formatValuePlain(key: string, value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'empty';
    if (
      [
        'disallowed',
        'allowed',
        'sitemaps',
        'scripts',
        'routes',
        'security',
        'subdomains',
        'headers',
        'txt',
        'comments',
      ].includes(key) &&
      typeof value[0] === 'string'
    ) {
      return '\n' + value.map((v, i) => `  ${i + 1}. ${v}`).join('\n');
    }
    return value.map(v => String(v)).join(', ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return 'empty';
    return entries.map(([k, v]) => `${k}: ${formatValuePlain(k, v)}`).join('\n');
  }
  return String(value);
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return chalk.gray('null');
  if (Array.isArray(value)) {
    if (value.length === 0) return chalk.gray('empty');
    if (
      [
        'disallowed',
        'allowed',
        'sitemaps',
        'scripts',
        'routes',
        'security',
        'subdomains',
        'headers',
        'txt',
        'comments',
      ].includes(key) &&
      typeof value[0] === 'string'
    ) {
      return '\n' + value.map((v, i) => `    ${i + 1}. ${v}`).join('\n');
    }
    return value.map(v => String(v)).join(', ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return chalk.gray('empty');
    return entries.map(([k, v]) => `${chalk.cyan(k)}: ${formatValue(k, v)}`).join('\n');
  }
  return String(value);
}

function formatModuleDataPlain(moduleName: string, result: ModuleResult): string {
  if (!result.success) {
    return `  Error: ${result.error}`;
  }

  if (!result.data) {
    return '  No data';
  }

  const data = result.data;
  const lines: string[] = [];

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '  No results';
    }
    if (typeof data[0] === 'object') {
      data.forEach((item, idx) => {
        const entries = Object.entries(item as Record<string, unknown>);
        entries.forEach(([k, v]) => {
          lines.push(`  ${k}: ${formatValuePlain(k, v)}`);
        });
        if (idx < data.length - 1) lines.push('');
      });
    } else {
      lines.push(`  ${formatValuePlain(moduleName, data)}`);
    }
  } else if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`  ${label}: ${formatValuePlain(key, value)}`);
    });
  } else {
    lines.push(`  ${formatValuePlain('', data)}`);
  }

  return lines.join('\n');
}

function formatModuleData(moduleName: string, result: ModuleResult): string {
  if (!result.success) {
    return chalk.red(`  Error: ${result.error}`);
  }

  if (!result.data) {
    return chalk.gray('  No data');
  }

  const data = result.data;
  const lines: string[] = [];

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return chalk.gray('  No results');
    }
    if (typeof data[0] === 'object') {
      data.forEach((item, idx) => {
        const entries = Object.entries(item as Record<string, unknown>);
        entries.forEach(([k, v]) => {
          lines.push(`  ${chalk.cyan(k)}: ${formatValue(k, v)}`);
        });
        if (idx < data.length - 1) lines.push('');
      });
    } else {
      lines.push(`  ${formatValue(moduleName, data)}`);
    }
  } else if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`  ${chalk.cyan(label)}: ${formatValue(key, value)}`);
    });
  } else {
    lines.push(`  ${formatValue('', data)}`);
  }

  return lines.join('\n');
}

function formatModulePlain(module: FormattedModule): string {
  const { name, type, result } = module;
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  const typeLabel = type === 'passive' ? '[PASSIVE]' : '[ACTIVE]';
  const status = result.success ? '✓' : '✗';

  const header = `${status} ${title} ${typeLabel}`;
  const content = formatModuleDataPlain(name, result);

  return `${header}\n${content}`;
}

function formatModule(module: FormattedModule): string {
  const { name, type, result } = module;
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  const typeLabel = type === 'passive' ? chalk.gray('[PASSIVE]') : chalk.gray('[ACTIVE]');
  const status = result.success ? chalk.green('✓') : chalk.red('✗');

  const header = result.success
    ? `${status} ${chalk.bold(title)} ${typeLabel}`
    : `${status} ${chalk.bold(title)} ${typeLabel}`;

  const content = formatModuleData(name, result);

  return `${header}\n${content}`;
}

function formatOutput(target: string, results: Results, useColors: boolean): string {
  const modules: FormattedModule[] = Object.entries(results).map(([name, result]) => ({
    name,
    type: MODULE_TYPES[name] || 'active',
    result: result as ModuleResult,
  }));

  const successful = modules.filter(m => m.result.success).length;
  const failed = modules.filter(m => !m.result.success).length;
  const total = modules.length;

  const statsLine = useColors
    ? [
        chalk.green(`✓ ${successful} successful`),
        failed > 0 ? chalk.red(`✗ ${failed} failed`) : chalk.gray(`✗ ${failed} failed`),
        chalk.gray(`${total} total`),
      ].join(' | ')
    : [`✓ ${successful} successful`, `✗ ${failed} failed`, `${total} total`].join(' | ');

  const title = useColors ? chalk.bold.cyan('xrecon Scan Results') : 'xrecon Scan Results';
  const targetLabel = useColors ? chalk.cyan('Target:') : 'Target:';
  const headerBox = boxen(`${title}\n\n${targetLabel} ${target}\n${statsLine}`, {
    padding: 1,
    borderStyle: 'round',
    borderColor: useColors ? 'cyan' : 'gray',
    titleAlignment: 'center',
  });

  let output = headerBox + '\n';

  const passiveModules = modules.filter(m => m.type === 'passive');
  const activeModules = modules.filter(m => m.type === 'active');

  const fmtModule = useColors ? formatModule : formatModulePlain;
  const fmtSection = useColors
    ? chalk.bold.underline('\nPassive Modules\n')
    : '\nPassive Modules\n';
  const fmtSectionActive = useColors
    ? chalk.bold.underline('\nActive Modules\n')
    : '\nActive Modules\n';

  if (passiveModules.length > 0) {
    output += fmtSection + '\n';
    passiveModules.forEach(m => {
      output += fmtModule(m) + '\n\n';
    });
  }

  if (activeModules.length > 0) {
    output += fmtSectionActive + '\n';
    activeModules.forEach(m => {
      output += fmtModule(m) + '\n\n';
    });
  }

  const divider = useColors ? chalk.gray('─'.repeat(50)) : '─'.repeat(50);
  const footer = useColors
    ? chalk.gray('  Results saved to JSON/HTML with -oJ / -oH flags')
    : '  Results saved to JSON/HTML with -oJ / -oH flags';

  output += divider + '\n' + footer;

  return output;
}

export function formatCliOutput(target: string, results: Results): void {
  console.log(formatOutput(target, results, true));
}

export function formatCliOutputPlain(target: string, results: Results): string {
  return formatOutput(target, results, false);
}
