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
  emails: 'active',
  phones: 'active',
  sitemap: 'active',
  robots: 'active',
  social: 'active',
  routes: 'active',
  cookies: 'active',
  storage: 'active',
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return chalk.gray('null');
  if (Array.isArray(value)) {
    if (value.length === 0) return chalk.gray('empty');
    if (['disallowed', 'allowed', 'sitemaps'].includes(key) && typeof value[0] === 'string') {
      return '\n' + value.map(v => `    • ${v}`).join('\n');
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
      lines.push(`  ${data.join('\n  ')}`);
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

export function formatCliOutput(target: string, results: Results): void {
  const modules: FormattedModule[] = Object.entries(results).map(([name, result]) => ({
    name,
    type: MODULE_TYPES[name] || 'active',
    result: result as ModuleResult,
  }));

  const successful = modules.filter(m => m.result.success).length;
  const failed = modules.filter(m => !m.result.success).length;
  const total = modules.length;

  const statsLine = [
    chalk.green(`✓ ${successful} successful`),
    failed > 0 ? chalk.red(`✗ ${failed} failed`) : chalk.gray(`✗ ${failed} failed`),
    chalk.gray(`${total} total`),
  ].join(' | ');

  const headerBox = boxen(
    `${chalk.bold.cyan('🔍 xrecon Scan Results')}\n\n` +
      `${chalk.cyan('Target:')} ${target}\n` +
      `${statsLine}`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      titleAlignment: 'center',
    }
  );

  console.log(headerBox);

  const passiveModules = modules.filter(m => m.type === 'passive');
  const activeModules = modules.filter(m => m.type === 'active');

  if (passiveModules.length > 0) {
    console.log(chalk.bold.underline('\nPassive Modules\n'));
    passiveModules.forEach(m => {
      console.log(formatModule(m));
      console.log('');
    });
  }

  if (activeModules.length > 0) {
    console.log(chalk.bold.underline('\nActive Modules\n'));
    activeModules.forEach(m => {
      console.log(formatModule(m));
      console.log('');
    });
  }

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  Results saved to JSON/HTML with -oJ / -oH flags'));
}
