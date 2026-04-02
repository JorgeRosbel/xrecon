import type { ModuleResult, ScanOutput } from '@/types';

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  if (Array.isArray(str)) return str.map(escapeHtml).join(', ');
  if (typeof str === 'object') {
    return Object.entries(str as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${escapeHtml(v)}`)
      .join('<br>');
  }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '<span class="text-muted">null</span>';
  if (Array.isArray(value)) {
    if (value.length === 0) return '<span class="text-muted">empty</span>';
    if (['disallowed', 'allowed', 'sitemaps', 'scripts', 'emails', 'phones'].includes(key)) {
      return (
        '<ul class="bullet-list">' + value.map(v => `<li>${escapeHtml(v)}</li>`).join('') + '</ul>'
      );
    }
    if (typeof value[0] === 'string') {
      return (
        '<ul class="bullet-list">' + value.map(v => `<li>${escapeHtml(v)}</li>`).join('') + '</ul>'
      );
    }
    return value.map(v => escapeHtml(v)).join('<br>');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '<span class="text-muted">empty</span>';
    return entries
      .map(
        ([k, v]) =>
          `<div class="field"><span class="field-key">${escapeHtml(k)}:</span> <span class="field-value">${formatValue(k, v)}</span></div>`
      )
      .join('');
  }
  const strValue = String(value);
  if (strValue.startsWith('http')) {
    return `<a href="${escapeHtml(strValue)}" target="_blank" class="link">${escapeHtml(strValue)}</a>`;
  }
  return escapeHtml(value);
}

function getStatusIcon(success: boolean): string {
  return success
    ? '<span class="status-dot success"></span>'
    : '<span class="status-dot error"></span>';
}

function generateHtml(output: ScanOutput): string {
  const modules = Object.entries(output.results);
  const timestamp = new Date().toLocaleString();

  const successfulCount = modules.filter(([_, r]) => (r as ModuleResult).success).length;
  const failedCount = modules.filter(([_, r]) => !(r as ModuleResult).success).length;
  const totalCount = modules.length;

  const MODULE_TYPES: Record<string, string> = {
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

  const passiveModules = modules.filter(([name]) => MODULE_TYPES[name] === 'passive');
  const activeModules = modules.filter(([name]) => MODULE_TYPES[name] === 'active');

  const renderCards = (mods: [string, ModuleResult][]) => {
    return mods
      .map(([name], idx) => {
        const result = mods[idx][1] as ModuleResult;
        const { success, data, error } = result;
        const type = MODULE_TYPES[name] || 'active';

        const content = success
          ? formatValue(name, data)
          : `<span class="error-text">${escapeHtml(error)}</span>`;

        return `
        <div class="card">
          <div class="card-header">
            <div class="card-title-row">
              <span class="card-title">${name}</span>
              <span class="badge badge-${type}">${type.toUpperCase()}</span>
            </div>
            ${getStatusIcon(success)}
          </div>
          <div class="card-body">${content}</div>
        </div>`;
      })
      .join('');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>xrecon - ${escapeHtml(output.target)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --background: #09090b;
      --foreground: #fafafa;
      --card: #18181b;
      --card-foreground: #fafafa;
      --primary: #22d3ee;
      --primary-foreground: #09090b;
      --muted: #71717a;
      --border: #27272a;
      --success: #22c55e;
      --error: #ef4444;
      --accent: #6366f1;
      --surface: #27272a;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--background);
      color: var(--foreground);
      line-height: 1.5;
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container { max-width: 1400px; margin: 0 auto; }
    
    header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .header-left h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.25rem;
    }
    
    .header-left .subtitle {
      color: var(--muted);
      font-size: 0.875rem;
    }
    
    .header-right {
      text-align: right;
      color: var(--muted);
      font-size: 0.75rem;
    }
    
    .target-url {
      color: var(--primary);
      font-weight: 500;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
      transition: all 0.2s ease;
    }
    
    .stat-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(34, 211, 238, 0.1);
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .stat-value.success { color: var(--success); }
    .stat-value.error { color: var(--error); }
    .stat-value.total { color: var(--primary); }
    
    .stat-label {
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    section {
      margin-bottom: 3rem;
    }
    
    section h2 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      padding-left: 0.5rem;
      border-left: 3px solid var(--primary);
    }
    
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1rem;
    }
    
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .card:hover {
      border-color: var(--primary);
      box-shadow: 0 8px 30px rgba(34, 211, 238, 0.1);
      transform: translateY(-2px);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    
    .card-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .card-title {
      font-weight: 600;
      font-size: 0.95rem;
      text-transform: capitalize;
    }
    
    .badge {
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .badge-passive {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    
    .badge-active {
      background: rgba(34, 211, 238, 0.2);
      color: var(--primary);
      border: 1px solid rgba(34, 211, 238, 0.3);
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    
    .status-dot.success {
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
    
    .status-dot.error {
      background: var(--error);
      box-shadow: 0 0 8px var(--error);
    }
    
    .card-body {
      padding: 1rem;
      font-size: 0.85rem;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .card-body::-webkit-scrollbar {
      width: 6px;
    }
    
    .card-body::-webkit-scrollbar-track {
      background: var(--surface);
    }
    
    .card-body::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }
    
    .card-body::-webkit-scrollbar-thumb:hover {
      background: var(--muted);
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
    }
    
    .bullet-list li {
      padding: 0.375rem 0;
      padding-left: 1.25rem;
      position: relative;
      word-break: break-all;
    }
    
    .bullet-list li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: var(--primary);
    }
    
    .field {
      padding: 0.25rem 0;
    }
    
    .field-key {
      color: var(--muted);
      font-size: 0.8rem;
    }
    
    .field-value {
      color: var(--foreground);
    }
    
    .text-muted {
      color: var(--muted);
      font-style: italic;
    }
    
    .error-text {
      color: var(--error);
    }
    
    .link {
      color: var(--primary);
      text-decoration: none;
      word-break: break-all;
    }
    
    .link:hover {
      text-decoration: underline;
    }
    
    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
      font-size: 0.75rem;
    }
    
    @media (max-width: 768px) {
      body { padding: 1rem; }
      .cards-grid { grid-template-columns: 1fr; }
      header { flex-direction: column; align-items: flex-start; }
      .header-right { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <h1>xrecon</h1>
        <p class="subtitle">OSINT Web Reconnaissance Tool</p>
      </div>
      <div class="header-right">
        <p>Target: <span class="target-url">${escapeHtml(output.target)}</span></p>
        <p>Generated: ${timestamp}</p>
      </div>
    </header>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value success">${successfulCount}</span>
        <span class="stat-label">Successful</span>
      </div>
      <div class="stat-card">
        <span class="stat-value error">${failedCount}</span>
        <span class="stat-label">Failed</span>
      </div>
      <div class="stat-card">
        <span class="stat-value total">${totalCount}</span>
        <span class="stat-label">Total Modules</span>
      </div>
    </div>
    
    ${
      passiveModules.length > 0
        ? `
    <section>
      <h2>Passive Modules</h2>
      <div class="cards-grid">
        ${renderCards(passiveModules)}
      </div>
    </section>
    `
        : ''
    }
    
    ${
      activeModules.length > 0
        ? `
    <section>
      <h2>Active Modules</h2>
      <div class="cards-grid">
        ${renderCards(activeModules)}
      </div>
    </section>
    `
        : ''
    }
    
    <footer>
      Generated with xrecon - OSINT CLI Tool
    </footer>
  </div>
</body>
</html>`;
}

export function generateHtmlOutput(output: ScanOutput): string {
  return generateHtml(output);
}
