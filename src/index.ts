import { program } from 'commander';
import packageJson from '../package.json' with { type: 'json' };

program
  .name('xrecon')
  .description(
    'OSINT CLI tool for web reconnaissance - gather passive and active information about websites.'
  )
  .version(packageJson.version);

program.parse();
