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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '<em>null</em>';
  if (Array.isArray(value)) {
    if (value.length === 0) return '<em>empty</em>';
    return value.map(v => escapeHtml(v)).join('<br>');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '<em>empty</em>';
    return entries
      .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`)
      .join('<br>');
  }
  return escapeHtml(value);
}

function getStatusBadge(success: boolean): string {
  return success
    ? '<span class="badge badge-success">Success</span>'
    : '<span class="badge badge-error">Error</span>';
}

function generateHtml(output: ScanOutput): string {
  const modules = Object.entries(output.results);
  const timestamp = new Date().toISOString();

  const moduleCards = modules
    .map(([name, result]) => {
      const { success, data, error } = result as ModuleResult;
      const content = success
        ? formatValue(data)
        : `<span class="error">${escapeHtml(error)}</span>`;

      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${name}</span>
            ${getStatusBadge(success)}
          </div>
          <div class="card-content">${content}</div>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>xrecon - ${output.target}</title>
  <style>
    :root {
      --background: #ffffff;
      --foreground: #0f172a;
      --card: #f8fafc;
      --card-foreground: #0f172a;
      --primary: #3b82f6;
      --primary-foreground: #ffffff;
      --muted: #64748b;
      --border: #e2e8f0;
      --success: #22c55e;
      --error: #ef4444;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #0f172a;
        --foreground: #f8fafc;
        --card: #1e293b;
        --card-foreground: #f8fafc;
        --primary: #60a5fa;
        --primary-foreground: #0f172a;
        --muted: #94a3b8;
        --border: #334155;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--background);
      color: var(--foreground);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: var(--muted); font-size: 0.875rem; }
    .target { color: var(--primary); font-weight: 600; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--border);
      border-bottom: 1px solid var(--border);
    }
    .card-title {
      font-weight: 600;
      text-transform: capitalize;
    }
    .card-content {
      padding: 1rem;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-success { background: var(--success); color: white; }
    .badge-error { background: var(--error); color: white; }
    .error { color: var(--error); }
    .stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--card);
      border-radius: 0.5rem;
    }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { color: var(--muted); font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>xrecon Scan Results</h1>
      <p class="meta">Target: <span class="target">${escapeHtml(output.target)}</span></p>
      <p class="meta">Generated: ${timestamp}</p>
    </header>
    <div class="stats">
      <div>
        <div class="stat-value">${modules.filter(([_, r]) => (r as ModuleResult).success).length}</div>
        <div class="stat-label">Successful</div>
      </div>
      <div>
        <div class="stat-value">${modules.filter(([_, r]) => !(r as ModuleResult).success).length}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div>
        <div class="stat-value">${modules.length}</div>
        <div class="stat-label">Total</div>
      </div>
    </div>
    <div class="grid">
      ${moduleCards}
    </div>
  </div>
</body>
</html>`;
}

export function generateHtmlOutput(output: ScanOutput): string {
  return generateHtml(output);
}
