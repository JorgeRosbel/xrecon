const PENDING = '○';
const DONE = '✓';
const FAILED = '✗';

interface ModuleStatus {
  name: string;
  status: 'pending' | 'done' | 'failed';
}

let modules: ModuleStatus[] = [];
let currentLine = '';
let initialized = false;

function getStatusIcon(status: 'pending' | 'done' | 'failed'): string {
  return status === 'pending' ? PENDING : status === 'done' ? DONE : FAILED;
}

function formatWidth(str: string, width: number): string {
  if (str.length >= width) return str;
  return str + ' '.repeat(width - str.length);
}

export function initProgress(moduleNames: string[]): void {
  modules = moduleNames.map(name => ({ name, status: 'pending' }));
  currentLine = '';
  initialized = true;
  render();
}

export function setWorking(_moduleName: string): void {
  // No need to mark as working in this simplified version
}

export function setDone(moduleName: string): void {
  const mod = modules.find(m => m.name === moduleName);
  if (mod) {
    mod.status = 'done';
    render();
  }
}

export function setFailed(moduleName: string): void {
  const mod = modules.find(m => m.name === moduleName);
  if (mod) {
    mod.status = 'failed';
    render();
  }
}

function render(): void {
  if (!initialized || modules.length === 0) return;

  const newLine = modules.map(m => `${getStatusIcon(m.status)} ${m.name}`).join('  ');

  if (newLine !== currentLine) {
    currentLine = newLine;
    process.stdout.write('\r' + formatWidth(currentLine, 60));
  }

  const allDone = modules.every(m => m.status !== 'pending');
  if (allDone) {
    process.stdout.write('\n');
    initialized = false;
  }
}

export function clearProgress(): void {
  if (initialized && modules.length > 0) {
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
    initialized = false;
    modules = [];
  }
}
