# xrecon

OSINT CLI tool for web reconnaissance - gather passive and active information about websites.

## Installation

### Using npm

```bash
npm install -g @jorge-rosbel/xrecon
```

### Using pnpm

```bash
pnpm add -g @jorge-rosbel/xrecon
```

### From source

```bash
# Clone the repository
git clone https://github.com/JorgeRosbel/xrecon.git
cd xrecon

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally
npm link
```

## Usage

```bash
# Run all modules (hybrid mode)
xrecon example.com -H

# Run only passive modules
xrecon example.com -P

# Run specific modules
xrecon example.com -w -s -c

# Save output to file
xrecon example.com -H -oN results.json
```

## Commands

### Global Options

| Flag                   | Description                         |
| ---------------------- | ----------------------------------- |
| `-H, --hybrid`         | Run both active and passive modules |
| `-P, --passive`        | Run only passive modules            |
| `-oN, --output <file>` | Save output to file                 |
| `-V, --version`        | Show version number                 |
| `--help`               | Display help information            |

### Passive Modules

| Flag               | Module     | Description                       |
| ------------------ | ---------- | --------------------------------- |
| `-w, --whois`      | whois      | Domain registration info via RDAP |
| `-m, --mx`         | mx         | MX records                        |
| `-t, --txt`        | txt        | TXT records (SPF, DKIM)           |
| `-S, --subdomains` | subdomains | Find subdomains                   |
| `-g, --geo`        | geo        | Geolocation                       |

### Active Modules

| Flag             | Module   | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `-h, --headers`  | headers  | HTTP headers                                       |
| `-c, --security` | security | Security headers                                   |
| `-T, --tech`     | tech     | Detect technologies                                |
| `-W, --wplugins` | wplugins | WordPress plugins                                  |
| `-s, --ssl`      | ssl      | SSL certificate info                               |
| `-O, --os`       | os       | OS detection via TTL                               |
| `-i, --metadata` | metadata | Page title and meta description                    |
| `-e, --emails`   | emails   | Extract emails                                     |
| `-p, --phones`   | phones   | Extract phone numbers                              |
| `-M, --sitemap`  | sitemap  | Sitemap URLs                                       |
| `-r, --robots`   | robots   | Robots.txt                                         |
| `-l, --social`   | social   | Social networks                                    |
| `-R, --routes`   | routes   | Public routes from sitemaps                        |
| `-k, --cookies`  | cookies  | Detect cookies                                     |
| `-K, --storage`  | storage  | Extract localStorage/sessionStorage and JWT tokens |

## Examples

### Full scan

```bash
xrecon example.com -H
```

### Passive reconnaissance only

```bash
xrecon example.com -P
```

### SSL and security headers

```bash
xrecon example.com -s -c
```

### Tech stack detection with WordPress plugins

```bash
xrecon example.com -T -W
```

### Extract all contact information

```bash
xrecon example.com -e -p
```

### Save results to file

```bash
xrecon example.com -H -oN scan-results.json
```

## Output

Results are output as JSON to stdout:

```json
{
  "target": "https://example.com",
  "results": {
    "whois": { "success": true, "data": {...} },
    "ssl": { "success": true, "data": {...} },
    ...
  }
}
```

## Requirements

- Node.js >= 18
- npm or pnpm

## License

MIT License - see LICENSE file for details.
